from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from enum import Enum


class DeviceType(str, Enum):
    LIGHT = "light"
    BLIND = "blind"
    PLUG = "plug"
    SENSOR = "sensor"
    SPEAKER = "speaker"
    THERMOSTAT = "thermostat"
    LOCK = "lock"
    UNKNOWN = "unknown"


class DeviceSource(str, Enum):
    IKEA = "ikea"
    MATTER = "matter"
    VIRTUAL = "virtual"


class DeviceState(BaseModel):
    is_on: Optional[bool] = None
    brightness: Optional[int] = Field(None, ge=0, le=100, description="0–100 %")
    color_temp: Optional[int] = Field(None, description="Kelvin (2200–6500)")
    color_hue: Optional[float] = None
    color_saturation: Optional[float] = None
    position: Optional[int] = Field(None, ge=0, le=100, description="Blind position %")
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    battery: Optional[int] = None
    extra: Dict[str, Any] = {}


class Device(BaseModel):
    id: str
    name: str
    room: Optional[str] = None
    type: DeviceType = DeviceType.UNKNOWN
    source: DeviceSource
    reachable: bool = True
    state: DeviceState = DeviceState()
    raw: Dict[str, Any] = {}


class DeviceCommand(BaseModel):
    is_on: Optional[bool] = None
    brightness: Optional[int] = Field(None, ge=0, le=100)
    color_temp: Optional[int] = None
    color_hue: Optional[float] = None
    color_saturation: Optional[float] = None
    position: Optional[int] = Field(None, ge=0, le=100)


class Room(BaseModel):
    id: str
    name: str
    icon: Optional[str] = None
    device_ids: List[str] = []
