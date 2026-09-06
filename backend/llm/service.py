from functools import lru_cache
from typing import Optional, Sequence

from backend.llm.config import LLMSettings, get_llm_settings
from backend.llm.models import LLMMessage, LLMResponse
from backend.llm.prompts import EVAT_SYSTEM_PROMPT
from backend.llm.providers.base import LLMProvider
from backend.llm.providers.factory import create_llm_provider


class LLMService:
    def __init__(
        self,
        provider: LLMProvider,
        settings: LLMSettings,
    ) -> None:
        self._provider = provider
        self._settings = settings

    @property
    def provider(self) -> LLMProvider:
        return self._provider

    async def chat(
        self,
        user_message: str,
        history: Optional[Sequence[LLMMessage]] = None,
    ) -> LLMResponse:
        cleaned_message = user_message.strip()

        if not cleaned_message:
            raise ValueError("The user message cannot be empty.")

        messages = [
            LLMMessage(
                role="system",
                content=EVAT_SYSTEM_PROMPT,
            )
        ]

        if history:
            messages.extend(history)

        messages.append(
            LLMMessage(
                role="user",
                content=cleaned_message,
            )
        )

        return await self._provider.chat(
            messages=messages,
            temperature=self._settings.temperature,
        )

    async def health_check(self) -> bool:
        return await self._provider.health_check()


@lru_cache(maxsize=1)
def get_llm_service() -> LLMService:
    settings = get_llm_settings()
    provider = create_llm_provider(settings)

    return LLMService(
        provider=provider,
        settings=settings,
    )