"""Central registry that aggregates all integrations."""
from typing import List, Dict
from functools import lru_cache
import structlog

from .base import BaseIntegration
from .ikea_dirigera import IKEADirigeraIntegration
from .matter import MatterIntegration
from ..models.device import Device, DeviceCommand, Room

log = structlog.get_logger()


class IntegrationRegistry:
    def __init__(self):
        self._integrations: List[BaseIntegration] = [
            IKEADirigeraIntegration(),
            MatterIntegration(),
        ]

    async def connect_all(self):
        for integration in self._integrations:
            await integration.connect()

    async def disconnect_all(self):
        for integration in self._integrations:
            await integration.disconnect()

    async def get_all_devices(self) -> List[Device]:
        devices = []
        for integration in self._integrations:
            if await integration.is_available():
                devices.extend(await integration.get_devices())
        return devices

    async def get_all_rooms(self) -> List[Room]:
        rooms = []
        seen = set()
        for integration in self._integrations:
            if await integration.is_available():
                for room in await integration.get_rooms():
                    if room.id not in seen:
                        rooms.append(room)
                        seen.add(room.id)
        return rooms

    async def send_command(self, device_id: str, command: DeviceCommand) -> bool:
        # Determine which integration owns this device
        if device_id.startswith("matter-"):
            target = next((i for i in self._integrations if i.name == "matter"), None)
        else:
            target = next((i for i in self._integrations if i.name == "ikea"), None)

        if target and await target.is_available():
            return await target.send_command(device_id, command)
        log.warning("no_integration_for_device", device_id=device_id)
        return False

    def get_context_string(self, devices: List[Device], rooms: List[Room]) -> str:
        """Build a concise text context for the AI system prompt."""
        lines = ["Devices:"]
        for d in devices:
            state_parts = []
            if d.state.is_on is not None:
                state_parts.append("ON" if d.state.is_on else "OFF")
            if d.state.brightness is not None:
                state_parts.append(f"{d.state.brightness}% brightness")
            if d.state.color_temp is not None:
                state_parts.append(f"{d.state.color_temp}K")
            state_str = ", ".join(state_parts) or "unknown state"
            room_str = f" [{d.room}]" if d.room else ""
            lines.append(f"  - id={d.id!r} name={d.name!r}{room_str} type={d.type.value} {state_str}")

        if rooms:
            lines.append("\nRooms:")
            for r in rooms:
                lines.append(f"  - id={r.id!r} name={r.name!r}")
        return "\n".join(lines)


_registry: IntegrationRegistry | None = None


def get_registry() -> IntegrationRegistry:
    global _registry
    if _registry is None:
        _registry = IntegrationRegistry()
    return _registry
