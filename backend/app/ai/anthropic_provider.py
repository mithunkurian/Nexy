import anthropic
from typing import List, AsyncIterator
from .base import BaseAIProvider, SYSTEM_PROMPT
from ..models.command import ChatMessage
from ..core.config import settings


class AnthropicProvider(BaseAIProvider):
    def __init__(self):
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._model = settings.anthropic_model

    def _build_messages(self, message: str, history: List[ChatMessage], context: str):
        msgs = []
        for m in history:
            msgs.append({"role": m.role, "content": m.content})
        user_content = message
        if context:
            user_content = f"[Home State]\n{context}\n\n[User] {message}"
        msgs.append({"role": "user", "content": user_content})
        return msgs

    async def chat(self, message: str, history: List[ChatMessage], context: str = "") -> str:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=self._build_messages(message, history, context),
        )
        return response.content[0].text

    async def stream(
        self, message: str, history: List[ChatMessage], context: str = ""
    ) -> AsyncIterator[str]:
        async with self._client.messages.stream(
            model=self._model,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=self._build_messages(message, history, context),
        ) as stream:
            async for text in stream.text_stream:
                yield text
