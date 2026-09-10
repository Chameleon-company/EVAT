import json
from dataclasses import replace
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

        # Support both frontend lat/lng and latitude/longitude formats.
        latitude = metadata.get(
            "latitude",
            metadata.get("lat"),
        )
        longitude = metadata.get(
            "longitude",
            metadata.get("lng"),
        )

        location_available = (
            not isinstance(latitude, bool)
            and not isinstance(longitude, bool)
            and isinstance(latitude, (int, float))
            and isinstance(longitude, (int, float))
            and -90 <= float(latitude) <= 90
            and -180 <= float(longitude) <= 180
        )

        if location_available:
            latitude = float(latitude)
            longitude = float(longitude)

        messages = [
            LLMMessage(
                role="system",
                content=EVAT_SYSTEM_PROMPT,
            )
        ]

        # Make application-provided location visible to the LLM
        # before it decides whether a location-based tool is needed.
        if location_available:
            messages.append(
                LLMMessage(
                    role="system",
                    content=(
                        "The user's current browser location is available. "
                        f"Latitude: {latitude}, longitude: {longitude}. "
                        "Use this location for requests such as near me, "
                        "nearby, closest, cheapest or fastest chargers "
                        "unless the user provides another location. "
                        "Do not ask the user for latitude or longitude when "
                        "this browser location is available."
                    ),
                )
            )

        if history:
            messages.extend(history)

        messages.append(
            LLMMessage(
                role="user",
                content=cleaned_message,
            )
        )

        tool_results = []

        for _ in range(max_tool_rounds):
            response = await self._provider.chat(
                messages=messages,
                temperature=self._settings.temperature,
                tools=EVAT_TOOLS,
            )

            if not response.tool_calls:
                final_content = response.content

                station_result = next(
                    (
                        result
                        for result in tool_results
                        if result.get("type") == "stations"
                    ),
                    None,
                )

                if station_result:
                    count = station_result.get("count", 0)
                    preference = station_result.get("preference")

                    if preference:
                        final_content = (
                            f"Here are the {count} {preference} "
                            "charging stations:"
                        )
                    else:
                        final_content = (
                            f"Here are {count} charging stations "
                            "for your route:"
                        )

                return replace(
                    response,
                    content=final_content,
                    tool_results=tool_results,
                )

            messages.append(
                LLMMessage(
                    role="assistant",
                    content=response.content,
                    tool_calls=response.tool_calls,
                )
            )

            for tool_call in response.tool_calls:
                arguments = dict(tool_call.arguments)

                # Use browser location when a location-based tool
                # does not already contain coordinates.
                if location_available:
                    if tool_call.name == "get_station_availability":
                        arguments.setdefault(
                            "lat",
                            latitude,
                        )
                        arguments.setdefault(
                            "lon",
                            longitude,
                        )

                    elif tool_call.name == "get_stations_by_preference":
                        arguments.setdefault(
                            "latitude",
                            latitude,
                        )
                        arguments.setdefault(
                            "longitude",
                            longitude,
                        )

                    elif tool_call.name == "get_route_stations":
                        start_location = arguments.get("start_location")
                        start_text = (
                            start_location.lower().strip()
                            if isinstance(start_location, str)
                            else ""
                        )
                        message_text = cleaned_message.lower()
                        browser_location_phrases = (
                            "my location",
                            "current location",
                            "my current location",
                            "your location",
                            "user location",
                            "my position",
                            "current position",
                            "my current position",
                            "your current position",
                            "from here",
                        )
                        uses_browser_location = (
                            not start_text
                            or start_text == "here"
                            or any(
                                phrase in start_text
                                for phrase in browser_location_phrases
                            )
                            or any(
                                phrase in message_text
                                for phrase in browser_location_phrases
                            )
                        )

                        if uses_browser_location:
                            arguments["start_location"] = [
                                latitude,
                                longitude,
                            ]

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

                if isinstance(result, dict):
                    tool_results.append(result)

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
            tool_results=tool_results,
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
