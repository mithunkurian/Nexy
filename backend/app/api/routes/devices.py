from fastapi import APIRouter, HTTPException, Depends
from typing import List
from ...integrations.registry import get_registry, IntegrationRegistry
from ...models.device import Device, DeviceCommand, Room
from ...core.websocket import manager

router = APIRouter(prefix="/devices", tags=["devices"])


def get_reg() -> IntegrationRegistry:
    return get_registry()


@router.get("/", response_model=List[Device])
async def list_devices(registry: IntegrationRegistry = Depends(get_reg)):
    return await registry.get_all_devices()


@router.get("/rooms", response_model=List[Room])
async def list_rooms(registry: IntegrationRegistry = Depends(get_reg)):
    return await registry.get_all_rooms()


@router.get("/{device_id}", response_model=Device)
async def get_device(device_id: str, registry: IntegrationRegistry = Depends(get_reg)):
    devices = await registry.get_all_devices()
    device = next((d for d in devices if d.id == device_id), None)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.post("/{device_id}/command")
async def command_device(
    device_id: str,
    command: DeviceCommand,
    registry: IntegrationRegistry = Depends(get_reg),
):
    ok = await registry.send_command(device_id, command)
    if not ok:
        raise HTTPException(status_code=502, detail="Command failed or device unreachable")

    # Push updated state to all WebSocket clients
    devices = await registry.get_all_devices()
    updated = next((d for d in devices if d.id == device_id), None)
    if updated:
        await manager.broadcast("device_update", updated.model_dump())

    return {"ok": True, "device_id": device_id}
