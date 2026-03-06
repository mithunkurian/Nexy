"""Matter / Thread integration via python-matter-server."""
import asyncio
import json
from typing import List, Optional
import structlog

from .base import BaseIntegration
from ..models.device import Device, DeviceCommand, DeviceType, DeviceSource, DeviceState, Room
from ..core.config import settings

log = structlog.get_logger()


class MatterIntegration(BaseIntegration):
    name = "matter"

    def __init__(self):
        self._client = None
        self._available = False
        self._nodes: dict = {}

    async def connect(self) -> None:
        if not settings.matter_server_url:
            return
        try:
            from matter_server.client import MatterClient
            import aiohttp

            session = aiohttp.ClientSession()
            self._client = MatterClient(settings.matter_server_url, session)
            await self._client.connect()
            self._available = True
            log.info("matter_connected", url=settings.matter_server_url)
        except Exception as e:
            log.warning("matter_connect_failed", error=str(e))
            self._available = False

    async def disconnect(self) -> None:
        if self._client:
            try:
                await self._client.disconnect()
            except Exception:
                pass
        self._available = False

    async def is_available(self) -> bool:
        return self._available

    async def get_devices(self) -> List[Device]:
        if not self._client:
            return []
        try:
            nodes = await self._client.get_nodes()
            devices = []
            for node in nodes:
                node_id = str(node.node_id)
                device_type = DeviceType.UNKNOWN
                # Basic Matter cluster mapping
                for endpoint in getattr(node, "endpoints", {}).values():
                    clusters = getattr(endpoint, "clusters", {})
                    if "OnOff" in clusters or 6 in clusters:
                        device_type = DeviceType.LIGHT
                        break

                state = DeviceState(
                    is_on=self._get_cluster_attr(node, "OnOff", "on_off"),
                    brightness=self._get_level_brightness(node),
                )
                devices.append(Device(
                    id=f"matter-{node_id}",
                    name=self._get_node_name(node),
                    type=device_type,
                    source=DeviceSource.MATTER,
                    reachable=getattr(node, "available", True),
                    state=state,
                ))
            return devices
        except Exception as e:
            log.error("matter_get_devices_failed", error=str(e))
            return []

    def _get_cluster_attr(self, node, cluster_name: str, attr: str):
        try:
            for ep in getattr(node, "endpoints", {}).values():
                clusters = getattr(ep, "clusters", {})
                cluster = clusters.get(cluster_name) or clusters.get(6)
                if cluster:
                    return getattr(cluster, attr, None)
        except Exception:
            pass
        return None

    def _get_level_brightness(self, node) -> Optional[int]:
        try:
            for ep in getattr(node, "endpoints", {}).values():
                clusters = getattr(ep, "clusters", {})
                lc = clusters.get("LevelControl") or clusters.get(8)
                if lc:
                    raw = getattr(lc, "current_level", None)
                    if raw is not None:
                        return int(raw * 100 / 254)
        except Exception:
            pass
        return None

    def _get_node_name(self, node) -> str:
        try:
            name = getattr(node, "name", None)
            if name:
                return name
        except Exception:
            pass
        return f"Matter Device {node.node_id}"

    async def get_rooms(self) -> List[Room]:
        return []  # Matter server doesn't expose room groupings

    async def send_command(self, device_id: str, command: DeviceCommand) -> bool:
        if not self._client or not device_id.startswith("matter-"):
            return False
        try:
            node_id = int(device_id.replace("matter-", ""))
            if command.is_on is True:
                await self._client.send_device_command(node_id, 1, 6, "on", {})
            elif command.is_on is False:
                await self._client.send_device_command(node_id, 1, 6, "off", {})
            if command.brightness is not None:
                level = int(command.brightness * 254 / 100)
                await self._client.send_device_command(
                    node_id, 1, 8, "move_to_level",
                    {"level": level, "transition_time": 5},
                )
            return True
        except Exception as e:
            log.error("matter_send_command_failed", device_id=device_id, error=str(e))
            return False
