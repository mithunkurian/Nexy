"""Abstract base class for all AI providers."""
from abc import ABC, abstractmethod
from typing import List, AsyncIterator
from ..models.command import ChatMessage


SYSTEM_PROMPT = """You are Nexy, an intelligent smart home AI assistant.
You control smart home devices including lights, blinds, plugs, and sensors.

You have access to the current state of all devices in the home via the context
provided in the user's message. When the user asks you to control devices, you
MUST respond in two parts:

1. A natural, friendly reply to the user (1-2 sentences).
2. A JSON block (if an action is needed) like this:

```json
{
  "actions": [
    {
      "action": "set_brightness",
      "target_ids": ["device-id-1"],
      "target_rooms": [],
      "params": { "brightness": 50 }
    }
  ]
}
```

Available actions:
- turn_on / turn_off → params: {}
- set_brightness → params: { "brightness": 0-100 }
- set_color_temp → params: { "color_temp": 2200-6500 }
- set_color → params: { "hue": 0-360, "saturation": 0-100 }
- set_position → params: { "position": 0-100 }  (blinds)

If no device action is needed, omit the JSON block entirely.
Always be concise, warm, and helpful."""


class BaseAIProvider(ABC):
    """Every AI backend must implement this interface."""

    @abstractmethod
    async def chat(
        self,
        message: str,
        history: List[ChatMessage],
        context: str = "",
    ) -> str:
        """Return the full AI response as a string."""
        ...

    @abstractmethod
    async def stream(
        self,
        message: str,
        history: List[ChatMessage],
        context: str = "",
    ) -> AsyncIterator[str]:
        """Yield response tokens one by one."""
        ...
