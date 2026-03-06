from functools import lru_cache
from .base import BaseAIProvider
from ..core.config import settings


@lru_cache(maxsize=1)
def get_ai_provider() -> BaseAIProvider:
    provider = settings.active_ai_provider.lower()
    if provider == "anthropic":
        from .anthropic_provider import AnthropicProvider
        return AnthropicProvider()
    elif provider == "openai":
        from .openai_provider import OpenAIProvider
        return OpenAIProvider()
    elif provider == "ollama":
        from .ollama_provider import OllamaProvider
        return OllamaProvider()
    else:
        raise ValueError(f"Unknown AI provider: {provider!r}. Choose anthropic, openai, or ollama.")
