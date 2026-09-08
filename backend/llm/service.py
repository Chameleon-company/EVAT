import json
from functools import lru_cache
from typing import Any, Dict, Optional, Sequence

from backend.llm.config import LLMSettings, get_llm_settings
from backend.llm.models import LLMMessage, LLMResponse
from backend.llm.prompts import EVAT_SYSTEM_PROMPT
from backend.llm.providers.base import LLMProvider
from backend.llm.providers.factory import create_llm_provider
from backend.llm.tools import EVAT_TOOLS, execute_tool_call


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
        tools: Optional[Sequence[Dict[str, Any]]] = None,
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
            tools=tools,
        )

    async def chat_with_tools(
        self,
        user_message: str,
        history: Optional[Sequence[LLMMessage]] = None,
        max_tool_rounds: int = 3,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> LLMResponse:
        cleaned_message = user_message.strip()

        if not cleaned_message:
            raise ValueError("The user message cannot be empty.")

        metadata = metadata or {}

        latitude = metadata.get("latitude")
        longitude = metadata.get("longitude")

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

        for _ in range(max_tool_rounds):
            response = await self._provider.chat(
                messages=messages,
                temperature=self._settings.temperature,
                tools=EVAT_TOOLS,
            )

            if not response.tool_calls:
                return response

            messages.append(
                LLMMessage(
                    role="assistant",
                    content=response.content,
                    tool_calls=response.tool_calls,
                )
            )

            for tool_call in response.tool_calls:
                arguments = dict(tool_call.arguments)

                if (
                    latitude is not None
                    and longitude is not None
                ):
                    if tool_call.name == "get_station_availability":
                        arguments["lat"] = latitude
                        arguments["lon"] = longitude

                    elif tool_call.name == "get_stations_by_preference":
                        arguments["latitude"] = latitude
                        arguments["longitude"] = longitude

                try:
                    result = execute_tool_call(
                        tool_call.name,
                        arguments,
                    )
                except ValueError as exc:
                    result = {
                        "error": str(exc),
                    }
                except Exception:
                    result = {
                        "error": (
                            "The EVAT backend tool could not be completed."
                        )
                    }

                messages.append(
                    LLMMessage(
                        role="tool",
                        content=json.dumps(result),
                        tool_name=tool_call.name,
                        tool_call_id=tool_call.id,
                    )
                )

        return LLMResponse(
            content=(
                "I could not complete the EVAT backend request "
                "within the allowed number of tool steps."
            ),
            provider=self._provider.provider_name,
            model=self._provider.model_name,
            finish_reason="tool_limit",
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