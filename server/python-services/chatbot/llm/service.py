import json
from dataclasses import replace
from functools import lru_cache
from typing import Any, Dict, Optional, Sequence

from chatbot.llm.config import LLMSettings, get_llm_settings
from chatbot.llm.models import LLMMessage, LLMResponse
from chatbot.llm.prompts import EVAT_SYSTEM_PROMPT
from chatbot.llm.providers.base import LLMProvider
from chatbot.llm.providers.factory import create_llm_provider
from chatbot.llm.tools import EVAT_TOOLS, execute_tool_call


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

        messages.append(
            LLMMessage(
                role="system",
                content=(
                    "For nearby, preference, emergency, and live-availability "
                    "tools: when the user names a suburb, postcode, or address, "
                    "copy that exact place into the tool's location argument. "
                    "A named place always overrides browser coordinates. Only "
                    "use browser coordinates for wording such as near me, my "
                    "location, or current location."
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

        messages.append(
            LLMMessage(
                role="system",
                content=(
                    "For nearby, preference, emergency, and live-availability "
                    "tools: when the user names a suburb, postcode, or address, "
                    "copy that exact place into the tool's location argument. "
                    "A named place always overrides browser coordinates. Only "
                    "use browser coordinates for wording such as near me, my "
                    "location, or current location."
                ),
            )
        )

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
                        "nearby, closest, cheapest, fastest, emergency or urgent "
                        "charging requests unless the user provides another location. "
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
        normalized_message = cleaned_message.lower()
        availability_phrases = (
            "live availability",
            "live charging availability",
            "check availability",
            "current availability",
            "currently available",
        )
        availability_requested = any(
            phrase in normalized_message
            for phrase in availability_phrases
        )

        tools_for_request = EVAT_TOOLS

        if availability_requested:
            tools_for_request = [
                tool
                for tool in EVAT_TOOLS
                if tool.get("function", {}).get("name")
                == "get_station_availability"
            ]
            messages.insert(
                len(messages) - 1,
                LLMMessage(
                    role="system",
                    content=(
                        "The user is explicitly requesting live charging "
                        "availability. Use get_station_availability with "
                        "the user's explicitly named location when provided; "
                        "otherwise use the application-provided location. Do not use a "
                        "nearby-stations search for this request."
                    ),
                ),
            )

        for _ in range(max_tool_rounds):
            response = await self._provider.chat(
                messages=messages,
                temperature=self._settings.temperature,
                tools=tools_for_request,
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
                    emergency = bool(station_result.get("emergency"))
                    connector = station_result.get("connector")
                    search_location = station_result.get("location")
                    location_suffix = (
                        f" near {search_location}"
                        if search_location
                        else " near you"
                    )

                    if emergency:
                        connector_label = (
                            str(connector).upper()
                            if connector
                            else None
                        )

                        if count == 0:
                            if connector_label:
                                final_content = (
                                    f"I couldn't find any {connector_label} compatible "
                                    f"emergency charging stations{location_suffix}."
                                )
                            else:
                                final_content = (
                                    "I couldn't find any emergency charging stations "
                                    f"{location_suffix}."
                                )

                        elif count == 1:
                            if connector_label:
                                final_content = (
                                    f"Here is 1 {connector_label} compatible "
                                    f"emergency charging station{location_suffix}:"
                                )
                            else:
                                final_content = (
                                    f"Here is 1 emergency charging station{location_suffix}:"
                                )

                        elif connector_label:
                            final_content = (
                                f"Here are {count} {connector_label} compatible "
                                f"emergency charging stations{location_suffix}:"
                            )

                        else:
                            final_content = (
                                f"Here are {count} emergency charging stations{location_suffix}:"
                            )

                    elif preference:
                        final_content = (
                            f"Here are the {count} {preference} "
                            f"charging stations{location_suffix if search_location else ''}:"
                        )

                    elif (
                        station_result.get("start_location")
                        and station_result.get("end_location")
                    ):
                        final_content = (
                            f"Here are {count} charging stations "
                            "along your route:"
                        )

                    else:
                        if search_location:
                            final_content = (
                                f"Here are the {count} closest charging stations "
                                f"to {search_location}:"
                            )
                        else:
                            final_content = (
                                f"Here are the {count} closest charging stations:"
                            )

                availability_result = next(
                    (
                        result
                        for result in reversed(tool_results)
                        if result.get("type") == "availability"
                    ),
                    None,
                )

                if availability_result:
                    status = str(
                        availability_result.get("status") or "Unknown"
                    ).lower()
                    availability_data = availability_result.get("data") or {}
                    station = availability_data.get("station") or {}
                    counts = availability_data.get("counts") or {}
                    station_name = station.get("name")
                    distance_km = station.get("distance_km")
                    station_label = (
                        f" at {station_name}"
                        if station_name
                        else " near your location"
                    )
                    distance_label = (
                        f" ({distance_km:.1f} km away)"
                        if isinstance(distance_km, (int, float))
                        else ""
                    )

                    if status == "yes":
                        available_count = int(counts.get("available") or 0)
                        final_content = (
                            f"{available_count} charging point"
                            f"{' is' if available_count == 1 else 's are'} "
                            f"currently available{station_label}{distance_label}."
                        )
                    elif status == "no":
                        occupied = int(counts.get("occupied") or 0)
                        reserved = int(counts.get("reserved") or 0)
                        out_of_service = int(
                            counts.get("out_of_service") or 0
                        )
                        final_content = (
                            f"No charging points are currently available"
                            f"{station_label}{distance_label}. "
                            f"Current status: {occupied} occupied, "
                            f"{reserved} reserved, and "
                            f"{out_of_service} out of service."
                        )
                    else:
                        message = availability_data.get("message")
                        final_content = message or (
                            "Live connector availability could not be confirmed "
                            f"{station_label}{distance_label}."
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
                current_location_tools = {
                    "get_station_availability",
                    "get_nearby_stations",
                    "get_stations_by_preference",
                    "get_emergency_charging_stations",
                }
                named_location = arguments.get("location")
                has_named_location = (
                    isinstance(named_location, str)
                    and bool(named_location.strip())
                )
                blocked_result = None

                # Never trust coordinates invented by the language model.
                # These tools must use either a named place or coordinates
                # supplied by the browser/application.
                if (
                    tool_call.name in current_location_tools
                    and not has_named_location
                    and not location_available
                ):
                    blocked_result = {
                        "error": (
                            "Your current location could not be obtained. "
                            "Please provide a suburb, postcode, or address."
                        )
                    }

                if (
                    tool_call.name == "get_route_stations"
                    and not location_available
                    and any(
                        phrase in cleaned_message.lower()
                        for phrase in browser_location_phrases
                    )
                ):
                    blocked_result = {
                        "error": (
                            "Your current location could not be obtained. "
                            "Please provide a specific starting location."
                        )
                    }

                # Use browser location when a location-based tool
                # does not already contain coordinates.
                if location_available:
                    if tool_call.name == "get_station_availability":
                        arguments["lat"] = latitude
                        arguments["lon"] = longitude

                    elif tool_call.name == "get_nearby_stations":
                        arguments["latitude"] = latitude
                        arguments["longitude"] = longitude

                    elif tool_call.name == "get_stations_by_preference":
                        arguments["latitude"] = latitude
                        arguments["longitude"] = longitude

                    elif tool_call.name == "get_emergency_charging_stations":
                        arguments["latitude"] = latitude
                        arguments["longitude"] = longitude
                        arguments.setdefault(
                            "vehicle_or_connector",
                            cleaned_message,
                        )

                    elif tool_call.name == "get_route_stations":
                        start_location = arguments.get("start_location")
                        start_text = (
                            start_location.lower().strip()
                            if isinstance(start_location, str)
                            else ""
                        )
                        uses_browser_location = (
                            not start_text
                            or start_text == "here"
                            or any(
                                phrase in start_text
                                for phrase in browser_location_phrases
                            )
                        )

                        if uses_browser_location:
                            arguments["start_location"] = [
                                latitude,
                                longitude,
                            ]

                if blocked_result is not None:
                    result = blocked_result
                else:
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

