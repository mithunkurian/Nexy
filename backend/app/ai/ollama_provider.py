import httpx
from typing import List, AsyncIterator
from .base import BaseAIProvider, SYSTEM_PROMPT
from ..models.command import ChatMessage
from ..core.config import settings


class OllamaProvider(BaseAIProvider):
    def __init__(self):
        self._base_url = settings.ollama_base_url.rstrip("/")
        self._model = settings.ollama_model

    def _build_messages(self, message: str, history: List[ChatMessage], context: str):
        msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
        for m in history:
            msgs.append({"role": m.role, "content": m.content})
        user_content = f"[Home State]\n{context}\n\n[User] {message}" if context else message
        msgs.append({"role": "user", "content": user_content})
        return msgs

    async def chat(self, message: str, history: List[ChatMessage], context: str = "") -> str:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{self._base_url}/api/chat",
                json={
                    "model": self._model,
                    "messages": self._build_messages(message, history, context),
                    "stream": False,
                },
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"]

    async def stream(
        self, message: str, history: List[ChatMessage], context: str = ""
    ) -> AsyncIterator[str]:
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                f"{self._base_url}/api/chat",
                json={
                    "model": self._model,
                    "messages": self._build_messages(message, history, context),
                    "stream": True,
                },
            ) as resp:
                import json
                async for line in resp.aiter_lines():
                    if line:
                        data = json.loads(line)
                        token = data.get("message", {}).get("content", "")
                        if token:
                            yield token
