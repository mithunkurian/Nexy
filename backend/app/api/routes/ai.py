import json
import re
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from ...ai import get_ai_provider, BaseAIProvider
from ...integrations.registry import get_registry, IntegrationRegistry
from ...models.command import ChatRequest, ChatResponse, AIAction
from ...models.device import DeviceCommand
from ...core.websocket import manager
import structlog

log = structlog.get_logger()
router = APIRouter(prefix="/ai", tags=["ai"])


def get_ai() -> BaseAIProvider:
    return get_ai_provider()


def get_reg() -> IntegrationRegistry:
    return get_registry()


def _extract_actions(text: str) -> tuple[str, list[AIAction]]:
    """Parse JSON action blocks from AI response text."""
    actions: list[AIAction] = []
    clean_text = text

    pattern = r"```json\s*(\{.*?\})\s*```"
    matches = re.findall(pattern, text, re.DOTALL)
    for raw in matches:
        try:
            data = json.loads(raw)
            for a in data.get("actions", []):
                actions.append(AIAction(**a))
            clean_text = re.sub(pattern, "", clean_text, count=1, flags=re.DOTALL).strip()
        except Exception as e:
            log.warning("action_parse_failed", error=str(e))

    return clean_text, actions


async def _execute_actions(
    actions: list[AIAction],
    registry: IntegrationRegistry,
):
    """Translate AIAction objects into actual device commands."""
    if not actions:
        return

    devices = await registry.get_all_devices()
    device_map = {d.id: d for d in devices}
    room_to_device_ids = {}
    for d in devices:
        if d.room:
            room_to_device_ids.setdefault(d.room.lower(), []).append(d.id)

    for action in actions:
        # Collect target device IDs
        target_ids = list(action.target_ids)
        for room_name in action.target_rooms:
            target_ids.extend(room_to_device_ids.get(room_name.lower(), []))

        # Build command
        cmd = DeviceCommand()
        act = action.action.lower()
        if act == "turn_on":
            cmd.is_on = True
        elif act == "turn_off":
            cmd.is_on = False
        elif act == "set_brightness":
            cmd.brightness = action.params.get("brightness")
        elif act == "set_color_temp":
            cmd.color_temp = action.params.get("color_temp")
        elif act == "set_color":
            cmd.color_hue = action.params.get("hue")
            cmd.color_saturation = action.params.get("saturation")
        elif act == "set_position":
            cmd.position = action.params.get("position")

        for device_id in target_ids:
            if device_id in device_map:
                ok = await registry.send_command(device_id, cmd)
                if ok:
                    updated = {**device_map[device_id].model_dump()}
                    await manager.broadcast("device_update", updated)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    ai: BaseAIProvider = Depends(get_ai),
    registry: IntegrationRegistry = Depends(get_reg),
):
    devices = await registry.get_all_devices()
    rooms = await registry.get_all_rooms()
    context = registry.get_context_string(devices, rooms)

    raw_reply = await ai.chat(req.message, req.history or [], context)
    reply, actions = _extract_actions(raw_reply)

    await _execute_actions(actions, registry)

    return ChatResponse(reply=reply, actions_taken=actions)


@router.post("/chat/stream")
async def chat_stream(
    req: ChatRequest,
    ai: BaseAIProvider = Depends(get_ai),
    registry: IntegrationRegistry = Depends(get_reg),
):
    devices = await registry.get_all_devices()
    rooms = await registry.get_all_rooms()
    context = registry.get_context_string(devices, rooms)

    full_response = []

    async def generate():
        async for token in ai.stream(req.message, req.history or [], context):
            full_response.append(token)
            yield token
        # After streaming ends, execute any actions in the full response
        full_text = "".join(full_response)
        _, actions = _extract_actions(full_text)
        await _execute_actions(actions, registry)

    return StreamingResponse(generate(), media_type="text/plain")
