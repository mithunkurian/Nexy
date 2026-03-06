"""IKEA Dirigera Hub integration via the dirigera Python SDK."""
import asyncio
from typing import List
import structlog

from .base import BaseIntegration
from ..models.device import Device, DeviceCommand, DeviceType, DeviceSource, DeviceState, Room
from ..core.config import settings

log = structlog.get_logger()


def _map_device_type(dtype: str) -> DeviceType:
    mapping = {
        "light": DeviceType.LIGHT,
        "blinds": DeviceType.BLIND,
        "outlet": DeviceType.PLUG,
        "environmentSensor": DeviceType.SENSOR,
        "motionSensor": DeviceType.SENSOR,
        "speaker": DeviceType.SPEAKER,
    }
    return mapping.get(dtype, DeviceType.UNKNOWN)


class IKEADirigeraIntegration(BaseIntegration):
    name = "ikea"

    def __init__(self):
        self._hub = None
        self._available = False

    async def connect(self) -> None:
        if not settings.dirigera_host or not settings.dirigera_token:
            log.warning("ikea_dirigera_not_configured")
            return
        try:
            import dirigera
            # dirigera SDK is synchronous; run in thread pool
            loop = asyncio.get_event_loop()
            self._hub = await loop.run_in_executor(
                None,
                lambda: dirigera.Hub(
                    token=settings.dirigera_token,
                    ip_address=settings.dirigera_host,
                ),
            )
            self._available = True
            log.info("ikea_dirigera_connected", host=settings.dirigera_host)
        except Exception as e:
            log.error("ikea_dirigera_connect_failed", error=str(e))
            self._available = False

    async def disconnect(self) -> None:
        self._hub = None
        self._available = False

    async def is_available(self) -> bool:
        return self._available

    async def get_devices(self) -> List[Device]:
        if not self._hub:
            return []
        try:
            loop = asyncio.get_event_loop()
            raw_devices = await loop.run_in_executor(None, self._hub.get_all_devices)
            devices = []
            for d in raw_devices:
                attrs = getattr(d, "attributes", {})
                if hasattr(attrs, "__dict__"):
                    attrs = attrs.__dict__

                state = DeviceState(
                    is_on=attrs.get("isOn"),
                    brightness=int(attrs["lightLevel"] * 100 / 254)
                    if "lightLevel" in attrs else None,
                    color_temp=attrs.get("colorTemperature"),
                )
                devices.append(Device(
                    id=d.id,
                    name=attrs.get("customName", d.id),
                    room=getattr(d, "room", {}).get("name") if isinstance(getattr(d, "room", None), dict) else None,
                    type=_map_device_type(getattr(d, "type", "")),
                    source=DeviceSource.IKEA,
                    reachable=attrs.get("isReachable", True),
                    state=state,
                    raw={"type": getattr(d, "type", "")},
                ))
            return devices
        except Exception as e:
            log.error("ikea_get_devices_failed", error=str(e))
            return []

    async def get_rooms(self) -> List[Room]:
        if not self._hub:
            return []
        try:
            loop = asyncio.get_event_loop()
            raw_rooms = await loop.run_in_executor(None, self._hub.get_all_rooms)
            return [
                Room(
                    id=r.id,
                    name=r.name,
                    icon=getattr(r, "icon", None),
                )
                for r in raw_rooms
            ]
        except Exception as e:
            log.error("ikea_get_rooms_failed", error=str(e))
            return []

    async def send_command(self, device_id: str, command: DeviceCommand) -> bool:
        if not self._hub:
            return False
        try:
            loop = asyncio.get_event_loop()
            raw_devices = await loop.run_in_executor(None, self._hub.get_all_devices)
            device = next((d for d in raw_devices if d.id == device_id), None)
            if not device:
                return False

            def _apply():
                if command.is_on is True:
                    device.set_light_state(True)
                elif command.is_on is False:
                    device.set_light_state(False)
                if command.brightness is not None:
                    ikea_level = int(command.brightness * 254 / 100)
                    device.set_light_level(ikea_level)
                if command.color_temp is not None:
                    device.set_color_temperature(command.color_temp)
                if command.color_hue is not None and command.color_saturation is not None:
                    device.set_color(
                        hue=command.color_hue,
                        saturation=command.color_saturation,
                    )
                if command.position is not None:
                    device.set_blinds_target_level(command.position)

            await loop.run_in_executor(None, _apply)
            return True
        except Exception as e:
            log.error("ikea_send_command_failed", device_id=device_id, error=str(e))
            return False
