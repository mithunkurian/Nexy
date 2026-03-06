from openai import AsyncOpenAI
from typing import List, AsyncIterator
from .base import BaseAIProvider, SYSTEM_PROMPT
from ..models.command import ChatMessage
from ..core.config import settings


class OpenAIProvider(BaseAIProvider):
    def __init__(self):
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        self._model = settings.openai_model

    def _build_messages(self, message: str, history: List[ChatMessage], context: str):
        msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
        for m in history:
            msgs.append({"role": m.role, "content": m.content})
        user_content = f"[Home State]\n{context}\n\n[User] {message}" if context else message
        msgs.append({"role": "user", "content": user_content})
        return msgs

    async def chat(self, message: str, history: List[ChatMessage], context: str = "") -> str:
        response = await self._client.chat.completions.create(
            model=self._model,
            messages=self._build_messages(message, history, context),
        )
        return response.choices[0].message.content

    async def stream(
        self, message: str, history: List[ChatMessage], context: str = ""
    ) -> AsyncIterator[str]:
        stream = await self._client.chat.completions.create(
            model=self._model,
            messages=self._build_messages(message, history, context),
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
