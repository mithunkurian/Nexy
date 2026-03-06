"""Abstract base for all home integrations."""
from abc import ABC, abstractmethod
from typing import List
from ..models.device import Device, DeviceCommand, Room


class BaseIntegration(ABC):
    name: str = "base"

    @abstractmethod
    async def connect(self) -> None: ...

    @abstractmethod
    async def disconnect(self) -> None: ...

    @abstractmethod
    async def get_devices(self) -> List[Device]: ...

    @abstractmethod
    async def get_rooms(self) -> List[Room]: ...

    @abstractmethod
    async def send_command(self, device_id: str, command: DeviceCommand) -> bool: ...

    async def is_available(self) -> bool:
        return False
