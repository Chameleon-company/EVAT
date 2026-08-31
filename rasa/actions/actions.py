from rasa_sdk import Action, Tracker
from rasa_sdk.events import SlotSet, FollowupAction
from rasa_sdk.executor import CollectingDispatcher
from typing import Any, Text, Dict, List, Optional, Tuple
from urllib.parse import quote_plus
import logging
import re

from actions.data_service import data_service
from actions.constants import ConversationContexts, MainMenuOptions, PreferenceTypes, ActionTypes, Messages

from backend.emergency_charging_service import (
    infer_connector_from_message as backend_infer_connector_from_message,
    filter_stations_by_connector as backend_filter_stations_by_connector,
)

# Import real-time integration
try:
    from .real_time_integration import real_time_manager
    REAL_TIME_INTEGRATION_AVAILABLE = True
except ImportError:
    REAL_TIME_INTEGRATION_AVAILABLE = False
    real_time_manager = None

logger = logging.getLogger(__name__)


def format_station_list(stations: List[Dict[str, Any]], limit: int = 5, show_indices: bool = True) -> str:
    lines: List[str] = []
    for i, station in enumerate(stations[:limit], 1):
        name = station.get('name', 'Unknown')
        distance = station.get('distance_km')
        power = station.get('power')
        cost = station.get('cost')

        prefix = f"{i}. " if show_indices else ""
        if distance is not None:
            lines.append(f"{prefix}**{name}** - {distance}km away")
        else:
            lines.append(f"{prefix}**{name}**")

        extras: List[str] = []
        if power:
            extras.append(f"⚡ {power}")
        if cost:
            extras.append(f"💰 {cost}")
        if extras:
            lines.append(f"   {' | '.join(extras)}")
    return "\n".join(lines)


def extract_from_to_route(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract start/end route locations from free text like 'from X to Y'."""
    if not text:
        return None, None
    import re
    match = re.search(
        r'^\s*from\s+(.+?)\s+\bto\b\s+(.+?)\s*$',
        text.strip(),
        flags=re.IGNORECASE
    )
    if not match:
        return None, None
    start = match.group(1).strip()
    end = match.group(2).strip()
    if not start or not end:
        return None, None
    return start, end


def _map_station_for_ui(station: Dict[str, Any]) -> Dict[str, Any]:
    """Convert internal station dict to frontend card schema.

    Required keys:
    - station_id: string
    - name: string
    - address: string
    - distance_km: number (float)
    - cost: string
    - power: number or None
    - availability: one of {"yes","no","busy","available"}
    """
    # Station ID: prefer provided IDs; fallback to lat/lon or name
    sid = station.get("station_id") or station.get("id") or station.get("ID")
    if not sid:
        lat = station.get("latitude")
        lon = station.get("longitude")
        if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
            sid = f"{lat},{lon}"
        else:
            sid = station.get("name") or "station"

    name = station.get("name") or "Unknown station"
    address = station.get("address", "")

    # Distance: prefer distance_km; else min(distance_from_start, distance_from_end)
    dist = station.get("distance_km")
    if not isinstance(dist, (int, float)):
        candidates: List[float] = []
        for k in ("distance_from_start", "distance_from_end"):
            v = station.get(k)
            if isinstance(v, (int, float)):
                candidates.append(float(v))
        dist = min(candidates) if candidates else 0.0

    # Power: parse first number
    power_val = None
    p = station.get("power")
    if isinstance(p, (int, float)):
        power_val = int(p)
    elif p is not None:
        import re as _re
        nums = _re.findall(r"\d+\.?\d*", str(p))
        if nums:
            try:
                power_val = int(float(nums[0]))
            except Exception:
                power_val = None

    cost = station.get("cost") or "—"

    # Availability mapping
    availability = station.get("availability")
    availability_str: str
    if isinstance(availability, str):
        val = availability.strip().lower()
        if val in {"yes", "no", "busy", "available"}:
            availability_str = val
        elif val in {"operational", "in service", "online"}:
            availability_str = "available"
        elif val in {
            "temporarily unavailable", "occupied", "in use", "charging"
        }:
            availability_str = "busy"
        elif val in {
            "not operational", "unavailable", "offline", "closed"
        }:
            availability_str = "no"
        else:
            availability_str = "no"
    elif isinstance(availability, bool):
        availability_str = "yes" if availability else "no"
    else:
        availability_str = "available"

    return {
        "station_id": str(sid),
        "name": name,
        "address": address,
        "distance_km": float(dist if isinstance(dist, (int, float)) else 0.0),
        "cost": str(cost),
        "power": power_val,
        "availability": availability_str,
    }


def _send_station_cards(dispatcher: CollectingDispatcher, stations: List[Dict[str, Any]], limit: int = 20) -> None:
    """Send stations to frontend in the expected custom payload schema."""
    try:
        mapped = [_map_station_for_ui(
            s) for s in stations[:limit] if isinstance(s, dict)]
        if mapped:
            dispatcher.utter_message(json_message={
                "stations": mapped,
                "show_availability": True,
            })
    except Exception:
        # Non-fatal if UI payload fails
        pass


class ActionCollectInitialLocation(Action):
    def name(self) -> Text:
        return "action_collect_initial_location"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        conversation_context = tracker.get_slot("conversation_context")

        # Check GPS metadata first — the frontend sends it on the initial "hello"
        user_lat = tracker.latest_message.get('metadata', {}).get('lat')
        user_lng = tracker.latest_message.get('metadata', {}).get('lng')

        if not conversation_context and user_lat and user_lng:
            # GPS arrived on the initial hello — skip "please share location" entirely
            dispatcher.utter_message(
                text="Hello! Welcome to Melbourne EV Charging Assistant! ⚡\n\n"
                     "✅ **Location detected!** Now I can help you find the best charging options.\n\n"
                     "Please select an option:\n\n"
                     "1. 🗺️ **Route Planning** - Plan charging stops for your journey\n"
                     "2. 🚨 **Emergency Charging** - Find nearest stations when battery is low\n"
                     "3. ⚡ **Charging Preferences** - Find stations by your preferences\n\n"
                     "🎯 Type 1, 2, or 3 to continue!")
            return [
                SlotSet("user_lat", user_lat),
                SlotSet("user_lng", user_lng),
                SlotSet("conversation_context", None),
            ]

        if not conversation_context:
            # First visit, no GPS — ask for location
            dispatcher.utter_message(
                text="Hello! Welcome to Melbourne EV Charging Assistant! ⚡\n\n"
                     "📍 Please share your location or type your suburb name (e.g. Richmond) to get started.")
            return [SlotSet("conversation_context", ConversationContexts.INITIAL_LOCATION_COLLECTION)]

        # Already in INITIAL_LOCATION_COLLECTION — user is typing their suburb
        if user_lat and user_lng:
            # GPS came in on a follow-up message
            dispatcher.utter_message(
                text="✅ **Location detected!** Now I can help you find the best charging options.\n\n"
                     "Please select an option:\n\n"
                     "1. 🗺️ **Route Planning** - Plan charging stops for your journey\n"
                     "2. 🚨 **Emergency Charging** - Find nearest stations when battery is low\n"
                     "3. ⚡ **Charging Preferences** - Find stations by your preferences\n\n"
                     "**🎯 Type 1, 2, or 3 to continue!**"
            )

            return [
                SlotSet("user_lat", user_lat),
                SlotSet("user_lng", user_lng),
                SlotSet("conversation_context", None)
            ]

        message = (tracker.latest_message.get('text') or '').strip()
        lower_message = message.lower()

        blocked_inputs = {
            "hi", "hello", "hey", "hey there",
            "1", "2", "3",
            "cheapest", "fastest", "premium",
            "thanks", "thank you", "thx",
            "bye", "goodbye"
        }

        if not message:
            dispatcher.utter_message(
                text="📍 **Location Required**\n\n"
                     "I need your current location to help you.\n\n"
                     "💡 **Tip:** Sharing your location gives you the most accurate results!"
            )
            return []

        if lower_message in blocked_inputs:
            dispatcher.utter_message(
                text="📍 **Please share your location first**\n\n"
                     "Type a Melbourne suburb like:\n"
                     "• Richmond\n"
                     "• Carlton\n"
                     "• Geelong\n"
                     "• Box Hill\n\n"
                     "Or allow location access 📱"
            )
            return []

        if len(message) < 4:
            dispatcher.utter_message(
                text="📍 **Location not clear**\n\n"
                     "Please type a full Melbourne suburb name like:\n"
                     "• Richmond\n"
                     "• Carlton\n"
                     "• Geelong\n"
                     "• Box Hill"
            )
            return []

        try:
            coords = data_service._get_location_coordinates(message)
            if coords:
                lat, lng = coords
                dispatcher.utter_message(
                    text=f"✅ **Location set to {message}!** Now I can help you find the best charging options.\n\n"
                         "Please select an option:\n\n"
                         "1. 🗺️ **Route Planning** - Plan charging stops for your journey\n"
                         "2. 🚨 **Emergency Charging** - Find nearest stations when battery is low\n"
                         "3. ⚡ **Charging Preferences** - Find stations by your preferences\n\n"
                         "**🎯 Type 1, 2, or 3 to continue!**"
                )

                return [
                    SlotSet("user_lat", lat),
                    SlotSet("user_lng", lng),
                    SlotSet("current_location", message),
                    SlotSet("conversation_context", None)
                ]
            else:
                dispatcher.utter_message(
                    text=f"❌ **Location not found**\n\n"
                         f"I couldn't find '{message}' in Melbourne.\n\n"
                         "**Please try:**\n"
                         "• A different suburb name (e.g., 'Richmond', 'Carlton')\n"
                         "• Share your GPS location 📱\n\n"
                         "💡 **Tip:** Make sure the suburb is in Melbourne!"
                )
                return []
        except Exception:
            dispatcher.utter_message(
                text="❌ **Error processing location**\n\n"
                     "Please try:\n"
                     "• A different suburb name\n"
                     "• Share your GPS location 📱"
            )
            return []


class ActionHandleAnyInput(Action):
    def name(self) -> Text:
        return "action_handle_any_input"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        message = tracker.latest_message.get('text', '').strip()
        conversation_context = tracker.get_slot("conversation_context")

        lower_msg = message.lower()
        if any(phrase in lower_msg for phrase in ["thanks", "thank you", "thx", "no thanks", "no thank you"]):
            dispatcher.utter_message(text=Messages.GOODBYE)
            return [SlotSet("conversation_context", ConversationContexts.ENDED)]

        if conversation_context:
            return []

        if message == "1":
            dispatcher.utter_message(
                text=f"🗺️ **Route Planning**\n\n{Messages.ROUTE_PLANNING_PROMPT}\n\n💡 **Example:** 'from Carlton to Geelong'")
            return [SlotSet("conversation_context", ConversationContexts.ROUTE_PLANNING)]

        elif message == "2":

            dispatcher.utter_message(
                text=f"🚨 **Emergency Charging**\n\n{Messages.EMERGENCY_PROMPT}\n\n💡 **Example:** 'Richmond'")
            return [SlotSet("conversation_context", ConversationContexts.EMERGENCY_CHARGING)]

        elif message == "3":

            dispatcher.utter_message(
                text=f"⚡ **Charging Preferences**\n\n{Messages.PREFERENCE_PROMPT}\n\n• Cheapest 💰\n• Fastest ⚡\n• Premium 🌟")
            return [SlotSet("conversation_context", ConversationContexts.PREFERENCE_CHARGING)]

        #Quick keyword routing to reduce fallback when users type labels instead if 1/2/3.
        elif any(k in lower_msg for k in ["route", "trip", "journey", "plan"]):
            dispatcher.utter_message(
                text=f"🗺️ **Route Planning**\n\n{Messages.ROUTE_PLANNING_PROMPT}\n\n💡 **Example:** 'from Carlton to Geelong'")
            return [SlotSet("conversation_context", ConversationContexts.ROUTE_PLANNING)]
        
        elif any(k in lower_msg for k in ["emergency", "urgent", "battery low", "low battery"]):
            dispatcher.utter_message(
                text=f"🚨 **Emergency Charging**\n\n{Messages.EMERGENCY_PROMPT}\n\n💡 **Example:** 'Richmond'")
            return [SlotSet("conversation_context", ConversationContexts.EMERGENCY_CHARGING)]
        
        elif any(k in lower_msg for k in ["preference", "cheapest", "fastest", "premium"]):
            dispatcher.utter_message(
                text=f"⚡ **Charging Preferences**\n\n{Messages.PREFERENCE_PROMPT}\n\n• Cheapest 💰\n• Fastest ⚡\n• Premium 🌟")
            return [SlotSet("conversation_context", ConversationContexts.PREFERENCE_CHARGING)]
        
        # If not a valid menu option, show the menu again
        else:

            dispatcher.utter_message(text=Messages.MAIN_MENU)
            return []


"""
Removed unused ActionHandleInitialInput.
"""


class ActionHandleMenuSelection(Action):
    def name(self) -> Text:
        return "action_handle_menu_selection"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        message = tracker.latest_message.get('text', '').strip()
        conversation_context = tracker.get_slot("conversation_context")

        if conversation_context == ConversationContexts.ROUTE_PLANNING_RESULTS:
            lower = message.lower().strip()
            # Auto-fire guard: when context just changed to route_planning_results the
            # message is still the route input (e.g. "to Carlton") — skip station matching.
            if (re.match(r'^\d+$', lower) or ' to ' in lower
                    or lower.startswith('to ') or lower.startswith('from ')):
                return []

            # Get the route information from slots
            start_location = tracker.get_slot("start_location")
            end_location = tracker.get_slot("end_location")

            stations = data_service.get_route_stations(
                start_location, end_location)

            if stations:
                # Look for a station that matches the user's input
                selected_station = None
                for station in stations:
                    station_name = station.get('name', '').lower()
                    if message.lower() in station_name or station_name in message.lower():
                        selected_station = station
                        break

                if selected_station:
                    # Show detailed information about the selected station
                    response = f"🔋 **Station Details: {selected_station.get('name', 'Unknown Station')}**\n\n"
                    response += f"📍 **Location:** {selected_station.get('suburb', 'Location available')}\n"
                    response += f"⚡ **Power:** {selected_station.get('power', 'Power info available')} charging\n"
                    response += f"💰 **Cost:** {selected_station.get('cost', 'Cost info available')}\n"
                    response += f"🔌 **Connector:** {selected_station.get('connection_types', 'Connector info available')}\n"
                    response += f"📱 **Network:** {selected_station.get('operator', 'Network info available')}\n\n"

                    # Add route context
                    response += f"🗺️ **Route:** {start_location} → {end_location}\n\n"

                    response += "**What would you like to do next?**\n\n"
                    response += "• **Get directions** 🧭\n"
                    response += "• **Check availability** ✅\n"
                    response += "• **Plan another route** 🗺️\n"
                    response += "• **Return to main menu** 🏠"

                    dispatcher.utter_message(text=response)

                    return [
                        SlotSet("selected_station",
                                selected_station.get('name')),
                        SlotSet("conversation_context",
                                ConversationContexts.STATION_DETAILS)
                    ]
                else:
                    dispatcher.utter_message(
                        text="Station not found — please type the exact name from the list above.")
                    return []
            else:
                # Keep user in route results; don't reset context on failure
                dispatcher.utter_message(
                    text=(
                        "❌ **No stations available**\n\n"
                        f"Unable to retrieve station information for the route {start_location} → {end_location}"
                    )
                )
                return []

        if conversation_context == ConversationContexts.ROUTE_PLANNING and ('from' in message.lower() and 'to' in message.lower()):
            # Extract start and end locations from the message
            start_location = None
            end_location = None

            # Split by 'from' and take everything after it
            after_from = message.lower().split('from', 1)[1]

            # Simple string search for " to " (with spaces)
            to_index = after_from.find(' to ')

            if to_index != -1:
                start_location = after_from[:to_index].strip()
                # +4 for " to " (including spaces)
                end_location = after_from[to_index + 4:].strip()

                if start_location and end_location and len(start_location) > 0 and len(end_location) > 0:
                    pass
                else:
                    # Debug trimmed
                    start_location = None
                    end_location = None
            else:
                start_location = None
                end_location = None

            if not start_location or not end_location:
                if not start_location and not end_location:
                    dispatcher.utter_message(
                        text="🗺️ **Route Planning**\n\nProvide your route: 'from [start] to [destination]'")
                elif not start_location:
                    dispatcher.utter_message(
                        text=f"🗺️ **Route Planning**\n\n✅ End location: {end_location}\n❌ Missing start location\n\nProvide: 'from [start] to {end_location}'")
                else:  # not end_location
                    dispatcher.utter_message(
                        text=f"🗺️ **Route Planning**\n\n✅ Start location: {start_location}\n❌ Missing end location\n\nProvide: 'from {start_location} to [destination]'")

                # Stay in route planning mode
                return [SlotSet("conversation_context", ConversationContexts.ROUTE_PLANNING)]

            # If we have both locations, process the route
            if start_location and end_location:
                # Set the slots and find charging stations
                # Try to get charging stations from the data service
                stations = data_service.get_route_stations(
                    start_location, end_location)

                if stations:
                    start_display = "Your Location" if isinstance(start_location, tuple) else start_location
                    _send_station_cards(dispatcher, stations, limit=20)
                    dispatcher.utter_message(
                        text=f"Found {len(stations)} station{'s' if len(stations) != 1 else ''} along your route "
                             f"from {start_display} to {end_location}. Tap a card or type a station name.")
                    displayed = stations[:20]

                    return [
                        SlotSet("start_location", start_location),
                        SlotSet("end_location", end_location),
                        SlotSet("displayed_stations", displayed),
                        SlotSet("conversation_context",
                                ConversationContexts.ROUTE_PLANNING_RESULTS)
                    ]
                else:
                    dispatcher.utter_message(
                        text=(
                            "🗺️ **Route Planning**\n\n"
                            f"❌ No charging stations found from {start_location} to {end_location}.\n\n"
                            "💡 Try another pair of locations (e.g., 'from Richmond to Dandenong')."
                        )
                    )
                    # Stay in route planning; do NOT switch to results context
                    return [
                        SlotSet("conversation_context",
                                ConversationContexts.ROUTE_PLANNING)
                    ]

        if conversation_context == ConversationContexts.EMERGENCY_CHARGING:
            return []

        if conversation_context == ConversationContexts.PREFERENCE_CHARGING and any(word in message.lower() for word in ['cheapest', 'fastest', 'premium', 'cheap', 'fast']):
            return []

        if message == "1":

            dispatcher.utter_message(
                text="🗺️ **Route Planning** - Plan charging stops for your journey\n\n"
                     "Where are you traveling to?\n\n"
                     "💡 **Examples:**\n"
                     "• 'to Carlton / to Port Melbourne / to Collingwood'\n"
                #  "• 'from Carlton to Geelong' (custom start point)"
            )
            return [SlotSet("conversation_context", ConversationContexts.ROUTE_PLANNING)]

        elif message == "2":

            dispatcher.utter_message(
                text="🚨 **Emergency Charging** - Find nearest stations when battery is low\n\n"
                     "Tell me your car model or connector type (e.g., 'CHAdeMO', 'Tesla Model 3', 'Type 2', 'CCS').")
            return [SlotSet("conversation_context", ConversationContexts.EMERGENCY_CHARGING)]

        elif message == "3":

            dispatcher.utter_message(
                text="⚡ **Charging Preferences** - Find stations by your preferences\n\n"
                     "What's most important to you?\n\n"
                     "• Cheapest 💰\n"
                     "• Fastest ⚡\n"
                     "• Premium 🌟")
            return [SlotSet("conversation_context", ConversationContexts.PREFERENCE_CHARGING)]

        else:
            if conversation_context:
                return []

            dispatcher.utter_message(text=Messages.MAIN_MENU)
            return []


"""
Removed unused ActionCollectUserLocation.
"""


class ActionHandleRouteInput(Action):
    def name(self) -> Text:
        return "action_handle_route_input"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        message = tracker.latest_message.get('text', '').lower().strip()
        conversation_context = tracker.get_slot("conversation_context")

        if conversation_context != ConversationContexts.ROUTE_PLANNING:
            return []

        stored_lat = tracker.get_slot("user_lat")
        stored_lng = tracker.get_slot("user_lng")

        if stored_lat and stored_lng:
            raw_text = tracker.latest_message.get('text', '') or ''
            raw_text = raw_text.strip()
            if raw_text:
                import re
                lower_raw = raw_text.lower()
                dest_text = None

                # Destination-only formats when user location is already known:
                # 1) "to Collingwood"
                if re.match(r'^\s*to\b', raw_text, flags=re.IGNORECASE):
                    dest_text = re.sub(r'^\s*to\b', '', raw_text,
                                       flags=re.IGNORECASE).strip()
                # 2) "Collingwood" (short destination phrase only)
                elif 'from' not in lower_raw and ' to ' not in lower_raw and len(raw_text.split()) <= 4:
                    dest_text = raw_text

                if dest_text:
                    start_location = (stored_lat, stored_lng)
                    end_location = dest_text
                    return self._process_route(dispatcher, start_location, end_location)

        # Check for traditional "from [start] to [destination]" format
        parsed_start, parsed_end = extract_from_to_route(
            tracker.latest_message.get('text', '') or ''
        )
        if parsed_start and parsed_end:

            # Extract start and end locations from the message
            start_location = parsed_start
            end_location = parsed_end

            if not start_location or not end_location:
                if not start_location and not end_location:
                    dispatcher.utter_message(
                        text="🗺️ **Route Planning**\n\nProvide your route: 'from [start] to [destination]'"
                    )
                elif not start_location:
                    dispatcher.utter_message(
                        text=f"🗺️ **Route Planning**\n\n✅ End location: {end_location}\n❌ Missing start location\n\nProvide: 'from [start] to {end_location}'"
                    )
                else:
                    dispatcher.utter_message(
                        text=f"🗺️ **Route Planning**\n\n✅ Start location: {start_location}\n❌ Missing end location\n\nProvide: 'from {start_location} to [destination]'"
                    )

                return [SlotSet("conversation_context", ConversationContexts.ROUTE_PLANNING)]

            if start_location and end_location:
                try:
                    stations = data_service.get_route_stations(start_location, end_location)

                    if stations:
                        start_display = "Your Location" if isinstance(start_location, tuple) else start_location
                        _send_station_cards(dispatcher, stations, limit=20)
                        dispatcher.utter_message(
                            text=f"Found {len(stations)} station{'s' if len(stations) != 1 else ''} along your route "
                                 f"from {start_display} to {end_location}. Tap a card or type a station name.")
                        displayed = stations[:20]
                        return [
                            SlotSet("start_location", start_location),
                            SlotSet("end_location", end_location),
                            SlotSet("displayed_stations", displayed),
                            SlotSet("conversation_context",
                                    ConversationContexts.ROUTE_PLANNING_RESULTS)
                        ]
                    else:
                        dispatcher.utter_message(
                            text=f"❌ **No charging stations found** along route: {start_location} → {end_location}\n\n"
                                 "💡 **Try:**\n"
                                 "• A different destination\n"
                                 "• Check if both locations are in Melbourne area"
                        )
                        return [SlotSet("conversation_context", ConversationContexts.ROUTE_PLANNING)]

                except Exception as e:
                    print(f"Error finding route stations: {e}")
                    dispatcher.utter_message(
                        text=f"❌ **Error processing route**\n\n"
                             f"Please try again or use the format: 'from [start] to [destination]'"
                    )
                    return [SlotSet("conversation_context", ConversationContexts.ROUTE_PLANNING)]

        else:
            dispatcher.utter_message(
                text="🗺️ **Route Planning**\n\n"
                     f"💡 **Available locations in dataset:**\n"
                     f"• Melbourne, Box Hill, Richmond, Carlton\n"
                     f"• St Kilda, Brighton, Geelong, Dandenong\n"
                     f"• And 190+ other suburbs\n\n"
            )
            return []

    def _process_route(self, dispatcher: CollectingDispatcher, start_location: str, end_location: str) -> List[Dict[Text, Any]]:
        try:
            stations = data_service.get_route_stations(start_location, end_location)

            if stations:
                start_display = "Your Location" if isinstance(start_location, tuple) else start_location
                _send_station_cards(dispatcher, stations, limit=20)
                dispatcher.utter_message(
                    text=f"Found {len(stations)} station{'s' if len(stations) != 1 else ''} along your route "
                         f"from {start_display} to {end_location}. Tap a card or type a station name.")
                displayed = stations[:20]
                return [
                    SlotSet("start_location", start_location),
                    SlotSet("end_location", end_location),
                    SlotSet("displayed_stations", displayed),
                    SlotSet("conversation_context",
                            ConversationContexts.ROUTE_PLANNING_RESULTS)
                ]
            else:
                dispatcher.utter_message(
                    text=f"❌ **No charging stations found** along route: {start_location} → {end_location}\n\n"
                         "💡 **Try:**\n"
                         "• A different destination\n"
                         "• Check if both locations are in Melbourne area"
                )
                return [SlotSet("conversation_context", ConversationContexts.ROUTE_PLANNING)]

        except Exception as e:
            dispatcher.utter_message(
                text=f"❌ **Error processing route**\n\n"
                     f"Please try again or use the format: 'from [start] to [destination]'"
            )
            return [SlotSet("conversation_context", ConversationContexts.ROUTE_PLANNING)]

"""
Removed unused ActionHandleEmergencyInput.
"""


class ActionHandlePreferenceInput(Action):
    def name(self) -> Text:
        return "action_handle_preference_input"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        message = tracker.latest_message.get('text', '').lower().strip()
        conversation_context = tracker.get_slot("conversation_context")

        # Only process if we're in preference charging context
        if conversation_context != ConversationContexts.PREFERENCE_CHARGING:
            return []

        if message in ["cheapest", "fastest", "premium"]:
            preference_type = message

            dispatcher.utter_message(
                text=f"⚡ **{preference_type.title()} Charging** selected!\n\n"
                     f"Where would you like to find {preference_type} charging stations?\n\n"
                     f"💡 **Example:** 'Melbourne' or 'Box Hill'")

            return [
                SlotSet("preference_type", preference_type),
                SlotSet("conversation_context",
                        ConversationContexts.PREFERENCE_CHARGING)
            ]

        # If not a valid preference, show options again
        else:
            dispatcher.utter_message(
                text="⚡ **Charging Preferences**\n\n"
                     "Please select one of these options:\n\n"
                     "• **Cheapest** 💰 - Find the most affordable stations\n"
                     "• **Fastest** ⚡ - Find the highest power stations\n"
                     "• **Premium** 🌟 - Find high-quality stations")
            return []


class ActionHandleRouteInfo(Action):
    def name(self) -> Text:
        return "action_handle_route_info"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        conversation_context = tracker.get_slot("conversation_context")
        if conversation_context == ConversationContexts.ROUTE_PLANNING_RESULTS:
            message = tracker.latest_message.get('text', '').lower().strip()
            start_location = tracker.get_slot("start_location")
            end_location = tracker.get_slot("end_location")

            stations = data_service.get_route_stations(
                start_location, end_location)
            if stations:
                # Prefer stations previously displayed if available
                displayed = tracker.get_slot("displayed_stations") or []
                selected_station = None

                def normalize(text: str) -> str:
                    return (text or '').lower().strip()

                # Try exact/contains match against displayed names first
                for s in displayed:
                    name = normalize(s.get('name'))
                    if name and (name in message or message in name):
                        selected_station = next(
                            (st for st in stations if normalize(st.get('name')) == name), None)
                        if not selected_station:
                            selected_station = next(
                                (st for st in stations if name in normalize(st.get('name'))), None)
                        if selected_station:
                            break

                # Fallback: search all stations in current route list
                if not selected_station:
                    for st in stations:
                        st_name = normalize(st.get('name'))
                        if st_name and (st_name in message or message in st_name):
                            selected_station = st
                            break

                if selected_station:
                    # Reuse the existing display util for details
                    details_resp = ActionHandleRouteStationSelection()._display_station_details(
                        dispatcher, selected_station, start_location, end_location
                    )
                    return details_resp

            # If no match, remind the user clearly
            dispatcher.utter_message(
                text=(
                    "Please type the exact station name from the list above.\n\n"
                    "Example: 'Evie Portland' or 'Newbridge Public Hall'"
                )
            )
            return []

        start_location = None
        end_location = None

        raw_text = tracker.latest_message.get('text', '') or ''
        raw_text = raw_text.strip()
        if raw_text:
            # Handle explicit "from X to Y" messages here as a safety net when route_info
            # is predicted and this action is selected.
            parsed_start, parsed_end = extract_from_to_route(raw_text)
            if parsed_start and parsed_end:
                return self._find_route_stations(dispatcher, parsed_start, parsed_end)

            # Only treat messages that START with 'to' as destination-only inputs here
            import re
            if re.match(r'^\s*to\b', raw_text, flags=re.IGNORECASE):
                dest_text = re.sub(r'^\s*to\b', '', raw_text,
                                   flags=re.IGNORECASE).strip()
                if dest_text and 'from' not in raw_text.lower():
                    stored_lat = tracker.get_slot("user_lat")
                    stored_lng = tracker.get_slot("user_lng")
                    if stored_lat and stored_lng:
                        start_location = (stored_lat, stored_lng)
                        end_location = dest_text
                        slots = [
                            SlotSet("start_location", start_location),
                            SlotSet("end_location", end_location)
                        ]
                        return slots + self._find_route_stations(dispatcher, start_location, end_location)
                    else:
                        dispatcher.utter_message(
                            text=f"🗺️ **Route Planning**\n\n"
                                 f"✅ Destination: {dest_text}\n"
                                 f"❌ I don't have your current location stored\n\n"
                                 f"Please provide your starting point:\n"
                                 f"• 'from [start] to {dest_text}'\n"
                                 f"• Or share your location again")
                        return []
        return []

    def _find_route_stations(self, dispatcher: CollectingDispatcher, start_location, end_location: str) -> List[Dict[Text, Any]]:
        stations = data_service.get_route_stations(
            start_location, end_location)

        if stations:
            start_display = "Your Location" if isinstance(start_location, tuple) else start_location
            _send_station_cards(dispatcher, stations, limit=20)
            dispatcher.utter_message(
                text=f"Found {len(stations)} station{'s' if len(stations) != 1 else ''} along your route "
                     f"from {start_display} to {end_location}. Tap a card or type a station name.")
            displayed = stations[:20]
            return [
                SlotSet("conversation_context",
                        ConversationContexts.ROUTE_PLANNING_RESULTS),
                SlotSet("displayed_stations", displayed),
                SlotSet("start_location", start_location),
                SlotSet("end_location", end_location)
            ]
        else:
            if REAL_TIME_INTEGRATION_AVAILABLE and real_time_manager:
                try:
                    real_time_data = real_time_manager.get_enhanced_route_planning(
                        start_location, end_location)

                    if real_time_data.get('success'):
                        response = self._format_real_time_route_response(
                            start_location, end_location, real_time_data)
                        dispatcher.utter_message(text=response)
                        return [
                            SlotSet("conversation_context",
                                    ConversationContexts.ROUTE_PLANNING_RESULTS),
                            SlotSet("start_location", start_location),
                            SlotSet("end_location", end_location)
                        ]
                except Exception as e:
                    print(f"Real-time integration error: {e}")

            dispatcher.utter_message(
                text=f"No charging stations found from {start_location} to {end_location}. Please try a different route.")
            return []

    def _format_real_time_route_response(self, start_location, end_location: str, real_time_data: Dict[str, Any]) -> str:
        start_display = "Your Location" if isinstance(start_location, tuple) else start_location

        response = f"🎯 **Real-time Route: {start_display} → {end_location}**\n\n"

        if real_time_data.get('route_info'):
            route = real_time_data['route_info']
            response += f"🗺️ **Route:** {route.get('distance_km', 0):.1f} km, {route.get('duration_minutes', 0):.0f} min\n"
            if route.get('traffic_delay_minutes', 0) > 0:
                response += f"🚦 **Traffic Delay:** +{route.get('traffic_delay_minutes', 0):.0f} min\n"

        if real_time_data.get('traffic_info'):
            traffic = real_time_data['traffic_info']
            response += f"🚦 **Traffic:** {traffic.get('traffic_status', 'Unknown')}\n"
            response += f"⚡ **Speed:** {traffic.get('current_speed_kmh', 0)} km/h\n"

        response += f"\n⚡ **Charging Stations:** Finding stations with real-time data...\n"
        response += f"💡 **Source:** TomTom API | 🕐 **Updated:** Just now"

        return response


class ActionHandleEmergencyCharging(Action):
    def name(self) -> Text:
        return "action_handle_emergency_charging"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        # Check for stored user location
        stored_lat = tracker.get_slot("user_lat")
        stored_lng = tracker.get_slot("user_lng")

        if not stored_lat or not stored_lng:
            dispatcher.utter_message(
                text="❌ I don't have your current location stored.\n\nPlease share your location first.")
            return []

        # Ask for connector type/car model first
        dispatcher.utter_message(
            text="🚨 **Emergency Charging** - Find nearest stations when battery is low\n\n"
                 "Tell me your car model or connector type (e.g., 'Tesla Model 3', 'Type 2', 'CCS').")

        return [SlotSet("conversation_context", ConversationContexts.EMERGENCY_CHARGING)]


class ActionHandleEmergencyLocationInput(Action):
    def name(self) -> Text:
        return "action_handle_emergency_location_input"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        conversation_context = tracker.get_slot("conversation_context")
        if conversation_context not in [ConversationContexts.EMERGENCY_CHARGING, ConversationContexts.EMERGENCY_RESULTS]:
            return []

        # Check for stored user location
        stored_lat = tracker.get_slot("user_lat")
        stored_lng = tracker.get_slot("user_lng")

        if not stored_lat or not stored_lng:
            dispatcher.utter_message(
                text="❌ I don't have your current location stored.\n\nPlease share your location first.")
            return []

        # Use stored coordinates
        current_location = f"({stored_lat:.4f}, {stored_lng:.4f})"

        if current_location:
            # Handle polite termination within emergency flow
            raw_message = tracker.latest_message.get('text', '')
            message = raw_message.lower().strip()
            if any(phrase in message for phrase in ["thanks", "thank you", "thx"]):
                dispatcher.utter_message(text=Messages.GOODBYE)
                return [SlotSet("conversation_context", ConversationContexts.ENDED)]

            connector = backend_infer_connector_from_message(message)
            start_location = (stored_lat, stored_lng)
            stations = data_service.get_emergency_stations_from_coordinates(
                start_location)

            if stations:
                if connector:
                    # Collect all stations with matching connector (up to 5)
                    matched = backend_filter_stations_by_connector(
                        stations,
                        connector,
                        limit=5,
                        )

                    if matched:
                        closest = matched[0]
                        closest_dest = closest.get('address') or closest.get('name')
                        dispatcher.utter_message(
                            text=f"🚨 Nearest {connector.upper()} compatible stations near your location.\n"
                                 f"🔌 Connector: {connector.upper()} — Tap a card or type a station name.")
                        _send_station_cards(dispatcher, matched, limit=5)
                        return [
                            SlotSet("conversation_context", ConversationContexts.EMERGENCY_RESULTS),
                            SlotSet("displayed_stations", matched),
                            SlotSet("start_location", current_location),
                            SlotSet("end_location", closest_dest),
                            SlotSet("selected_station", closest.get('name'))
                        ]
                    else:
                        # No connector match — fall back to nearest stations without filtering
                        closest = stations[0]
                        closest_dest = closest.get('address') or closest.get('name')
                        dispatcher.utter_message(
                            text=f"⚠️ No {connector.upper()} compatible stations found nearby. "
                                 f"Here are the closest stations:")
                        _send_station_cards(dispatcher, stations, limit=5)
                        return [
                            SlotSet("conversation_context", ConversationContexts.EMERGENCY_RESULTS),
                            SlotSet("displayed_stations", stations[:5]),
                            SlotSet("start_location", current_location),
                            SlotSet("end_location", closest_dest),
                            SlotSet("selected_station", closest.get('name'))
                        ]
                else:
                    # No connector specified — show 5 nearest stations
                    closest = stations[0]
                    closest_dest = closest.get('address') or closest.get('name')
                    dispatcher.utter_message(
                        text="🚨 Nearest charging stations near your location. Tap a card or type a station name.")
                    _send_station_cards(dispatcher, stations, limit=5)
                    return [
                        SlotSet("conversation_context", ConversationContexts.EMERGENCY_RESULTS),
                        SlotSet("displayed_stations", stations[:5]),
                        SlotSet("start_location", current_location),
                        SlotSet("end_location", closest_dest),
                        SlotSet("selected_station", closest.get('name'))
                    ]
            else:
                dispatcher.utter_message(
                    text=f"❌ No emergency charging stations found near {current_location}. Please try a different area.")
                return []

    def _find_emergency_stations(self, dispatcher: CollectingDispatcher, current_location: str) -> List[Dict[Text, Any]]:
        stations = data_service.get_emergency_stations(current_location)

        if stations:
            _send_station_cards(dispatcher, stations, limit=5)
            response = f"🚨 Emergency charging stations near {current_location}:\n\n"

            for i, station in enumerate(stations[:5], 1):
                response += f"{i}. **{station['name']}** - {station['distance_km']}km away, {station['cost']} ✅\n"

            response += "\nAll have available charging points. Which one?"
            dispatcher.utter_message(text=response)
            return [SlotSet("conversation_context", ConversationContexts.EMERGENCY_RESULTS)]
        else:
            dispatcher.utter_message(
                text=f"No charging stations found near {current_location}. Please try a different location.")
            return []



class ActionHandlePreferenceCharging(Action):
    def name(self) -> Text:
        return "action_handle_preference_charging"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        message = tracker.latest_message.get('text', '').lower().strip()
        conversation_context = tracker.get_slot("conversation_context")
        preference = None

        if conversation_context == ConversationContexts.ROUTE_PLANNING_RESULTS:
            start_location = tracker.get_slot("start_location")
            end_location = tracker.get_slot("end_location")
            try:
                stations = data_service.get_route_stations(
                    start_location, end_location)
                if stations:
                    displayed = tracker.get_slot("displayed_stations") or []
                    selected_station = None

                    def normalize(text: str) -> str:
                        return (text or '').lower().strip()

                    for s in displayed:
                        name = normalize(s.get('name'))
                        if name and (name in message or message in name):
                            selected_station = next(
                                (st for st in stations if normalize(st.get('name')) == name), None)
                            if not selected_station:
                                selected_station = next(
                                    (st for st in stations if name in normalize(st.get('name'))), None)
                            if selected_station:
                                break

                    if not selected_station:
                        for st in stations:
                            st_name = normalize(st.get('name'))
                            if st_name and (st_name in message or message in st_name):
                                selected_station = st
                                break

                    if selected_station:
                        return ActionHandleRouteStationSelection()._display_station_details(
                            dispatcher, selected_station, start_location, end_location
                        )
            except Exception as e:
                print(f"PreferenceCharging quick-select error: {e}")

            # If no station matched, ask the user to type exact name again
            dispatcher.utter_message(
                text=(
                    "Please type the exact station name from the list above.\n\n"
                    "Example: 'Evie Portland' or 'Newbridge Public Hall'"
                )
            )
            return []

        # Only handle preferences inside the preference charging context
        if conversation_context != ConversationContexts.PREFERENCE_CHARGING:
            return []

        if any(word in message for word in ['cheapest', 'cheap', 'lowest', 'cost']):
            preference = PreferenceTypes.CHEAPEST
        elif any(word in message for word in ['fastest', 'fast', 'speed', 'ultra']):
            preference = PreferenceTypes.FASTEST

        elif any(word in message for word in ['premium', 'best', 'luxury', 'amenities']):
            preference = PreferenceTypes.PREMIUM

        if preference:
            # Check for stored user location first
            stored_lat = tracker.get_slot("user_lat")
            stored_lng = tracker.get_slot("user_lng")

            if stored_lat and stored_lng:
                # Use stored GPS coordinates
                current_location = f"({stored_lat:.4f}, {stored_lng:.4f})"

                # Get stations by preference using stored coordinates
                try:
                    coords = (stored_lat, stored_lng)
                    stations = data_service.get_stations_by_preference(
                        coords, preference)

                    if stations:
                        _send_station_cards(dispatcher, stations, limit=5)
                        return [
                            SlotSet("charging_preference", preference),
                            SlotSet("current_location", current_location),
                            SlotSet("conversation_context",
                                    ConversationContexts.PREFERENCE_RESULTS),
                            SlotSet("displayed_stations", stations[:5])
                        ]
                    else:
                        dispatcher.utter_message(
                            text=f"❌ No {preference.lower()} charging stations found near your location. Please try a different preference.")
                        return [SlotSet("charging_preference", preference)]

                except Exception as e:
                    dispatcher.utter_message(
                        text=f"❌ Error finding {preference.lower()} stations: {str(e)}")
                    return [SlotSet("charging_preference", preference)]
            else:
                # Fallback to asking for location if GPS not available
                dispatcher.utter_message(
                    text=f"⚡ {preference} charging stations. Please provide your location.")
                return [SlotSet("charging_preference", preference)]
        else:
            dispatcher.utter_message(
                text="Please choose a preference:\n\n"
                     "• **Cheapest** - Lowest cost per kWh 💰\n"
                     "• **Fastest** - Ultra-fast charging speeds ⚡\n"
                     "• **Premium** - Best facilities & amenities 🌟")
            return []


class ActionGetDirectionsById(Action):
    def name(self) -> Text:
        return "action_get_directions_by_id"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        # Extract station_id from slash intent payload
        station_id: Optional[str] = None
        for ent in tracker.latest_message.get("entities", []) or []:
            if ent.get("entity") == "station_id" and ent.get("value") is not None:
                station_id = str(ent.get("value"))
                break

        displayed: List[Dict[str, Any]] = tracker.get_slot("displayed_stations") or []

        # Try to find matching station in displayed list
        target_station: Optional[Dict[str, Any]] = None
        if isinstance(displayed, list):
            for st in displayed:
                if not isinstance(st, dict):
                    continue
                try:
                    mapped = _map_station_for_ui(st)
                    if station_id and str(mapped.get("station_id")) == str(station_id):
                        target_station = st
                        break
                except Exception:
                    continue

        user_lat = tracker.get_slot("user_lat")
        user_lng = tracker.get_slot("user_lng")

        # Parse destination coordinates from station_id ("lat,lng" string)
        dest_lat: Optional[float] = None
        dest_lng: Optional[float] = None
        if isinstance(station_id, str) and "," in station_id:
            try:
                parts = station_id.split(",", 1)
                dest_lat = float(parts[0].strip())
                dest_lng = float(parts[1].strip())
            except (ValueError, IndexError):
                pass

        # Get destination label
        if target_station:
            destination = target_station.get("name") or target_station.get("address") or station_id or "Destination"
            # Extract station lat/lng if not yet parsed
            if dest_lat is None:
                try:
                    dest_lat = float(target_station.get("latitude") or 0) or None
                    dest_lng = float(target_station.get("longitude") or 0) or None
                except (TypeError, ValueError):
                    pass
        else:
            destination = station_id or "Destination"

        # Build a directions URL (for "Open in Google Maps" link)
        if user_lat is not None and dest_lat is not None:
            maps_url = (
                f"https://www.google.com/maps/dir/?api=1"
                f"&origin={user_lat},{user_lng}"
                f"&destination={dest_lat},{dest_lng}"
                f"&travelmode=driving"
            )
        else:
            maps_url = ActionAdvancedDirections()._build_maps_link("My Location", destination)

        # Google Maps calculates directions after the user opens the link.
        # No additional TomTom request is required here.
        route_info: Dict[str, Any] = {}

        # Send rich directions card; station_lat/lng used by frontend for iframe embed URL
        dispatcher.utter_message(json_message={
            "type": "directions",
            "origin": "Your Location",
            "destination": destination,
            "station_lat": dest_lat,
            "station_lng": dest_lng,
            "distance_km": route_info.get("distance_km"),
            "eta_min": route_info.get("duration_minutes"),
            "delay_min": route_info.get("traffic_delay_minutes"),
            "instructions": [str(s) for s in route_info.get("instructions", [])][:10],
            "maps_url": maps_url,
        })

        # Ask user if they want traffic follow-up
        dispatcher.utter_message(
            text="Would you like real-time traffic for this route?",
            buttons=[
                {"title": "Yes, show traffic", "payload": "/affirm"},
                {"title": "No, thanks", "payload": "/deny"},
            ]
        )

        start_slot = [user_lat, user_lng] if user_lat is not None and user_lng is not None else "My Location"
        return [
            SlotSet("start_location", start_slot),
            SlotSet("end_location", destination),
            SlotSet("conversation_context", ConversationContexts.GETTING_DIRECTIONS),
        ]


class ActionHandlePreferenceLocationInput(Action):
    def name(self) -> Text:
        return "action_handle_preference_location_input"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        preference = tracker.get_slot("charging_preference")
        location = tracker.get_slot(
            "current_location") or tracker.latest_message.get('text', '').strip()

        if not preference:
            dispatcher.utter_message(
                text="Please select a charging preference first.")
            return []

        if not location:
            dispatcher.utter_message(text="Please provide your location.")
            return []

        coords = data_service._get_location_coordinates(location)
        if not coords:
            dispatcher.utter_message(
                text=f"❌ I can't find charging stations in {location}.")
            return []

        stations = data_service.get_stations_by_preference(
            coords, preference)

        if stations:
            _send_station_cards(dispatcher, stations, limit=5)
            return [
                SlotSet("conversation_context",
                        ConversationContexts.PREFERENCE_RESULTS),
                SlotSet("current_location", location),
                SlotSet("displayed_stations", stations[:5])
            ]
        else:
            dispatcher.utter_message(
                text=f"No {preference.lower()} charging stations found near {location}. Please try a different location.")
            return []


class ActionHandleRouteStationSelection(Action):
    def name(self) -> Text:
        return "action_handle_route_station_selection"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        conversation_context = tracker.get_slot("conversation_context")
        # Allow selection both right after route results and after a comparison view
        if conversation_context not in [ConversationContexts.ROUTE_PLANNING_RESULTS, ConversationContexts.STATION_DETAILS]:

            pref_contexts = [ConversationContexts.PREFERENCE_CHARGING,
                             ConversationContexts.PREFERENCE_RESULTS]
            if conversation_context in pref_contexts:
                displayed = tracker.get_slot("displayed_stations") or []
                names = ", ".join([s.get('name')
                                   for s in displayed]) or "the list above"
                dispatcher.utter_message(
                    text=(
                        "❌ I can't match that to a station from the current list. "
                        f"Please type one of: {names}."
                    )
                )
                return []
            # If no context, likely the input didn't include a recognisable station or route
            dispatcher.utter_message(
                text=(
                    "❌ I couldn't determine a destination. "
                    "This can happen if the station name isn't in the dataset or wasn't clear. "
                )
            )
            return []

        message = tracker.latest_message.get('text', '').lower().strip()
        decision_phrases = [
            "i go with", "i choose", "i select", "i pick",
            "i would like to go to", "i would like to go", "i would like",
            "i'd like to go to", "i'd like to go", "i'd like",
            "i will go with", "i'll go with", "go with", "take"
        ]
        decision_requested = any(
            phrase in message for phrase in decision_phrases)
        selected_station_name = self._extract_station_name(message)

        if not selected_station_name:
            dispatcher.utter_message(
                text=(
                    "❌ I couldn't extract a station from your message. "
                    "It might not be in the dataset or was unclear. Try the exact name shown above, e.g., 'Lynbrook Village'."
                )
            )
            return []

        start_location = tracker.get_slot("start_location")
        end_location = tracker.get_slot("end_location")

        try:
            stations = data_service.get_route_stations(
                start_location, end_location)
            if stations:
                # Prefer the stations we actually displayed
                displayed = tracker.get_slot("displayed_stations") or []
                selected_station = None
                # Try match against displayed snapshot first
                if displayed:
                    for s in displayed:
                        name = self._normalize_station_name(s.get('name'))
                        selected_name = self._normalize_station_name(selected_station_name)

                        if selected_name in name or name in selected_name:
                            # find full station dict from current stations by name
                            selected_station = next((st for st in stations if (
                                self._normalize_station_name(st.get('name', '')) == name)), None)

                            if not selected_station:
                                 # fallback to first partial match
                                  selected_station = next(
                                        (st for st in stations if name in self._normalize_station_name(st.get('name', ''))), None)
                                        
                            break
                if not selected_station:
                  for station in stations:
                    station_name = self._normalize_station_name(station.get('name'))
                    selected_name = self._normalize_station_name(selected_station_name)

                    if selected_name in station_name or station_name in selected_name:
                      selected_station = station
                      break

                if selected_station:
                    if decision_requested:
                        # Directly provide directions and trigger traffic when possible
                        current_location = tracker.get_slot("current_location")
                        origin_for_link = start_location or current_location or "My Location"
                        maps_link = ActionAdvancedDirections()._build_maps_link(
                            origin_for_link,
                            selected_station.get(
                                'address') or selected_station.get('name')
                        )
                        response = (
                            f"🧭 **Directions**\n\n"
                            f"Start: {origin_for_link}\n"
                            f"Destination: {selected_station.get('name')}\n\n"
                            f"🔗 {maps_link}"
                        )
                        dispatcher.utter_message(text=response)
                        from rasa_sdk.events import FollowupAction
                        events = [
                            SlotSet("selected_station",
                                    selected_station.get('name')),
                            SlotSet("end_location",
                                    selected_station.get('name')),
                            SlotSet("conversation_context", None),
                        ]
                        # Persist a concrete origin if we have one (avoid hardcoding defaults)
                        if start_location:
                            events.append(
                                SlotSet("start_location", start_location))
                        elif current_location:
                            events.append(
                                SlotSet("start_location", current_location))
                        # Trigger traffic only if both origin and destination are known
                        if start_location or current_location:
                            events.append(FollowupAction(
                                "action_traffic_info"))
                        return events
                    else:
                        return self._display_station_details(dispatcher, selected_station, start_location, end_location)
                else:
                    # Provide a dataset-aware explanation instead of robotic repeat
                    displayed_names = ", ".join(
                        [s.get('name') for s in (
                            tracker.get_slot("displayed_stations") or [])]
                    ) or "the list above"
                    dispatcher.utter_message(
                        text=(
                            "❌ I couldn't find that station in the dataset for this route. "
                            f"Please choose one of: {displayed_names}."
                        )
                    )
                    return []
            else:
                dispatcher.utter_message(
                    text="No stations found. Please plan a route again.")
                return []

        except Exception as e:
            print(f"Error in station selection: {e}")
            dispatcher.utter_message(
                text="Unable to process station selection. Please try again.")
            return []

    def _normalize_station_name(self, text: str) -> str:
        text = (text or "").lower().strip()
        text = text.replace("centre", "center")
        text = text.replace("&", "and")
        text = text.replace("-", " ")
        text = " ".join(text.split())
        return text

    def _extract_station_name(self, message: str) -> Optional[str]:
        message = message.strip()
        if len(message) > 2:
            return message
        return None

    def _display_station_details(self, dispatcher: CollectingDispatcher, station_details: Dict, start_location: str, end_location: str) -> List[Dict[Text, Any]]:
        """Display detailed station information and next action options"""
        response = f"🎯 **{station_details['name']}**\n\n"
        response += f"📍 **Address:** {station_details.get('address', 'Address available')}\n"
        response += f"⚡ **Power:** {station_details.get('power', 'Power info available')} charging\n"
        response += f"💰 **Cost:** {station_details.get('cost', 'Cost info available')}\n"
        response += f"🕐 **Charging time:** {station_details.get('charging_time', 'Time estimate available')}\n"
        response += f"🔌 **Available points:** {station_details.get('points', 'Point info available')}\n\n"

        response += "**🎯 What would you like to do next?**\n\n"
        response += "• Type 'get directions' to this station 🧭\n"
        response += "• Type 'compare options' 📊\n"
        response += "• Type 'check availability' ✅"

        dispatcher.utter_message(text=response)
        return [
            SlotSet("conversation_context",
                    ConversationContexts.STATION_DETAILS),
            SlotSet("selected_station", station_details.get('name'))
        ]


class ActionHandleEmergencyStationSelection(Action):
    def name(self) -> Text:
        return "action_handle_emergency_station_selection"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        conversation_context = tracker.get_slot("conversation_context")
        if conversation_context not in [ConversationContexts.EMERGENCY_CHARGING, ConversationContexts.EMERGENCY_RESULTS]:
            return []

        message = tracker.latest_message.get('text', '').lower().strip()
        selected_station_name = self._extract_station_name(message)

        if not selected_station_name:
            dispatcher.utter_message(
                text="Please type the station name from the list above.")
            return []

        current_location = tracker.get_slot("current_location")
        # Battery no longer required in emergency flow
        if not current_location:
            dispatcher.utter_message(
                text="❌ I need your location to proceed. Please type your suburb (e.g., 'Richmond').")
            return []

        stations = data_service.get_emergency_stations(current_location)
        if stations:
            selected_station = None
            station_index = None

            for i, station in enumerate(stations):
                if selected_station_name.lower() in station.get('name', '').lower():
                    selected_station = station
                    station_index = i + 1
                    break

            if selected_station:
                return self._display_emergency_station_details(dispatcher, selected_station, station_index, current_location)
            else:
                dispatcher.utter_message(
                    text="Station not found. Please type the exact station name from the list above.")
                return []
        else:
            dispatcher.utter_message(
                text="No emergency stations found. Please try a different location.")
            return []

    def _extract_station_name(self, message: str) -> Optional[str]:
        message = message.strip()
        if len(message) > 2:
            return message
        return None

    def _display_emergency_station_details(self, dispatcher: CollectingDispatcher, selected_station: Dict, station_index: int, current_location: str) -> List[Dict[Text, Any]]:
        response = f"🚨 **Emergency Station {station_index}: {selected_station['name']}**\n\n"
        response += f"📍 **Address:** {selected_station.get('address', 'Address available')}\n"
        response += f"⚡ **Power:** {selected_station.get('power', 'Power info available')} charging\n"
        response += f"💰 **Cost:** {selected_station.get('cost', 'Cost info available')}\n"
        response += f"🕐 **Charging time:** {selected_station.get('charging_time', 'Time estimate available')}\n"
        response += f"🔌 **Available points:** {selected_station.get('points', 'Point info available')}\n\n"

        response += "**🎯 What would you like to do next?**\n\n"
        response += "• Type 'get directions' to this station 🧭\n"
        response += "• Type 'compare options' 📊\n"
        response += "• Type 'check availability' ✅"

        dispatcher.utter_message(text=response)
        return [
            SlotSet("conversation_context",
                    ConversationContexts.STATION_DETAILS),
            SlotSet("selected_station", selected_station.get('name'))
        ]


class ActionHandlePreferenceStationSelection(Action):
    def name(self) -> Text:
        return "action_handle_preference_station_selection"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        conversation_context = tracker.get_slot("conversation_context")
        if conversation_context not in [ConversationContexts.PREFERENCE_CHARGING, ConversationContexts.PREFERENCE_RESULTS]:
            return []

        message = tracker.latest_message.get('text', '').lower().strip()
        selected_station_name = self._extract_station_name(message)

        if not selected_station_name:
            dispatcher.utter_message(
                text="Please type the station name from the list above.")
            return []

        preference = tracker.get_slot("charging_preference")
        location = tracker.get_slot("current_location")

        if not preference or not location:
            dispatcher.utter_message(
                text="❌ Missing preference or location. Please start over.")
            return []

        try:
            # Check if location is already GPS coordinates
            if isinstance(location, str) and location.startswith('(') and location.endswith(')'):
                # Extract coordinates from string format "(lat, lng)"
                try:
                    lat_str, lng_str = location.strip('()').split(',')
                    coords = (float(lat_str.strip()), float(lng_str.strip()))
                except:
                    dispatcher.utter_message(
                        text=f"❌ Invalid location format: {location}")
                    return []
            else:
                # Try to convert text location to coordinates
                coords = data_service._get_location_coordinates(location)
                if not coords:
                    dispatcher.utter_message(
                        text=f"❌ I can't find charging stations in {location}.")
                    return []

            stations = data_service.get_stations_by_preference(
                coords, preference)
            if stations:
                selected_station = None
                station_index = None

                for i, station in enumerate(stations):
                    if selected_station_name.lower() in station.get('name', '').lower():
                        selected_station = station
                        station_index = i + 1
                        break

                if selected_station:
                    # Directly provide directions, then trigger real-time traffic if possible
                    current_location = tracker.get_slot("current_location")
                    origin_for_link = current_location or tracker.get_slot(
                        "start_location") or "My Location"
                    maps_link = ActionAdvancedDirections()._build_maps_link(
                        origin_for_link,
                        selected_station.get(
                            'address') or selected_station.get('name')
                    )
                    response = (
                        f"🧭 **Directions**\n\n"
                        f"Start: {origin_for_link}\n"
                        f"Destination: {selected_station.get('name')}\n\n"
                        f"🔗 {maps_link}"
                    )
                    dispatcher.utter_message(text=response)
                    from rasa_sdk.events import FollowupAction
                    events: List[Dict[Text, Any]] = [
                        SlotSet("selected_station",
                                selected_station.get('name')),
                        SlotSet("end_location", selected_station.get('name')),
                        SlotSet("start_location", current_location or tracker.get_slot(
                            "start_location")),
                        SlotSet("conversation_context", None),
                    ]
                    if current_location or tracker.get_slot("start_location"):
                        events.append(FollowupAction("action_traffic_info"))
                    return events
                else:
                    dispatcher.utter_message(
                        text="Station not found. Please type the exact station name from the list above.")
                    return []
            else:
                dispatcher.utter_message(
                    text="No preference-based stations found. Please try a different location.")
                return []

        except Exception as e:
            print(f"Error in preference station selection: {e}")
            dispatcher.utter_message(
                text="Unable to process station selection. Please try again.")
            return []

    def _extract_station_name(self, message: str) -> Optional[str]:
        message = message.strip()
        if len(message) > 2:
            return message
        return None

    def _display_preference_station_details(self, dispatcher: CollectingDispatcher, selected_station: Dict, station_index: int, location: str, preference: str) -> List[Dict[Text, Any]]:
        response = f"⚡ **{preference.title()} Station {station_index}: {selected_station['name']}**\n\n"
        response += f"📍 **Address:** {selected_station.get('address', 'Address available')}\n"
        response += f"⚡ **Power:** {selected_station.get('power', 'Power info available')} charging\n"
        response += f"💰 **Cost:** {selected_station.get('cost', 'Cost info available')}\n"
        response += f"🕐 **Charging time:** {selected_station.get('charging_time', 'Time estimate available')}\n"
        response += f"🔌 **Available points:** {selected_station.get('points', 'Point info available')}\n\n"

        response += "**🎯 What would you like to do next?**\n\n"
        response += "• Type 'get directions' to this station 🧭\n"
        response += "• Type 'compare options' 📊\n"
        response += "• Type 'check availability' ✅"

        dispatcher.utter_message(text=response)
        return [
            SlotSet("conversation_context",
                    ConversationContexts.STATION_DETAILS),
            SlotSet("selected_station", selected_station.get('name'))
        ]


class ActionHandleActionChoice(Action):
    def name(self) -> Text:
        return "action_handle_action_choice"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        conversation_context = tracker.get_slot("conversation_context")
        if conversation_context != ConversationContexts.STATION_DETAILS:
            return []

        message = tracker.latest_message.get('text', '').lower().strip()
        choice = None

        if any(word in message for word in ['compare', 'comparison', 'other', 'options']):
            choice = "compare"
        elif any(word in message for word in ['availability', 'available', 'status', 'check']):
            choice = "availability"

        if choice == "compare":
            return self._show_comparison(dispatcher, tracker)
        elif choice == "availability":
            self._show_availabilty(dispatcher, tracker)

            return [SlotSet("conversation_context", ConversationContexts.ENDED)]
        else:
            dispatcher.utter_message(
                text="Please type one of: 'get directions', 'compare options', or 'check availability'")
            return []

    def _show_comparison(self, dispatcher: CollectingDispatcher, tracker: Tracker) -> List[Dict[Text, Any]]:
        start_location = tracker.get_slot("start_location")
        end_location = tracker.get_slot("end_location")
        displayed = tracker.get_slot("displayed_stations") or []

        stations_to_compare: List[Dict[str, Any]] = []
        try:
            route_stations = data_service.get_route_stations(
                start_location, end_location) if start_location and end_location else []
            # Map by lowercased name for quick lookup
            by_name = {(s.get('name') or '').lower()
                        : s for s in route_stations}

            # Prefer the ones we showed to the user first
            for s in displayed[:5]:
                name = (s.get('name') or '').lower()
                if name and name in by_name:
                    stations_to_compare.append(by_name[name])

            if len(stations_to_compare) < 3:
                for s in route_stations:
                    if s not in stations_to_compare:
                        stations_to_compare.append(s)
                    if len(stations_to_compare) >= 5:
                        break
        except Exception as e:
            print(f"Compare options error: {e}")

        if not stations_to_compare:
            dispatcher.utter_message(
                text="❌ No stations available to compare right now.")
            return []

        lines: List[str] = []
        lines.append("📊 Comparison of options on your route:\n")
        for i, st in enumerate(stations_to_compare, 1):
            lines.append(f"{i}. **{st.get('name','Unknown')}**")
            lines.append(f"   📍 {st.get('suburb','Location available')}")
            lines.append(f"   ⚡ {st.get('power','Power info available')}")
            lines.append(f"   💰 {st.get('cost','Cost info available')}")
            lines.append(f"   🔌 Points: {st.get('points','Info available')}\n")

        lines.append(
            "Type a station name to choose one, or type 'get directions' for the selected station.")
        dispatcher.utter_message(text="\n".join(lines))
        return [SlotSet("conversation_context", ConversationContexts.STATION_DETAILS)]

    def _show_availabilty(self, dispatcher: CollectingDispatcher, tracker: Tracker) -> List[Dict[Text, Any]]:

        # Prefer selected station coordinates when available; otherwise use stored user location
        lat = None
        lng = None

        selected_station = tracker.get_slot("selected_station")
        displayed_stations = tracker.get_slot("displayed_stations") or []
        if selected_station and displayed_stations:
            for st in displayed_stations:
                if st.get("name") == selected_station:
                    lat = st.get("latitude")
                    lng = st.get("longitude")
                    break

        if lat is None or lng is None:
            lat = tracker.get_slot("user_lat")
            lng = tracker.get_slot("user_lng")

        if lat is None or lng is None:
            dispatcher.utter_message(
                text=f"I need a location to check availability.")
            return []

        status, updated_at, data = data_service._get_station_availability(
            float(lat), float(lng))

        # Guard against non-dict payloads (e.g., string errors)
        if not isinstance(data, dict):
            msg = f"🔌 **Station Availability:** {status}\n"
            if isinstance(data, str) and data.strip():
                msg += data.strip()
            else:
                msg += "No additional availability details available."
            dispatcher.utter_message(text=msg)
            return []

        msg = f"🔌 **Station Availability:**\n"
        connectors = data.get('connectors', [])
        if not connectors:
            info = data.get('raw')
            if isinstance(info, str) and info.strip():
                msg += info.strip()
            else:
                msg += f"{status}"
            dispatcher.utter_message(text=msg)
            return []
        for conn in connectors:
            conn_type = conn.get('type', 'Unknown')
            total = conn.get('total', 0)
            current = conn.get('availability', {}).get('current', {})
            available = current.get('available', 0)
            occupied = current.get('occupied', 0)
            reserved = current.get('reserved', 0)
            unknown = current.get('unknown', 0)
            out_of_service = current.get('outOfService', 0)
            msg += (
                f"\n• **{conn_type}** (Total: {total})\n"
                f"   - Available: {available}\n"
                f"   - Occupied: {occupied}\n"
                f"   - Reserved: {reserved}\n"
                f"   - Unknown: {unknown}\n"
                f"   - Out of Service: {out_of_service}\n"
            )
            # Show per power level if available
            per_power = conn.get('availability', {}).get('perPowerLevel', [])
            for p in per_power:
                power_kw = p.get('powerKW', '')
                msg += (
                    f"   - Power: {power_kw} kW | "
                    f"Available: {p.get('available', 0)}, "
                    f"Occupied: {p.get('occupied', 0)}, "
                    f"Reserved: {p.get('reserved', 0)}, "
                    f"Unknown: {p.get('unknown', 0)}, "
                    f"Out of Service: {p.get('outOfService', 0)}\n"
                )

        dispatcher.utter_message(text=msg)
        return []


class ActionHandleFollowUp(Action):
    def name(self) -> Text:
        return "action_handle_follow_up"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        conversation_context = tracker.get_slot("conversation_context")

        if conversation_context == ConversationContexts.GETTING_DIRECTIONS:
            dispatcher.utter_message(
                text="🗺️ Directions are being calculated...")
        elif conversation_context == ConversationContexts.COMPARING_STATIONS:
            dispatcher.utter_message(
                text="📊 Station comparison in progress...")
        elif conversation_context == ConversationContexts.CHECKING_AVAILABILITY:
            dispatcher.utter_message(text="✅ Checking availability...")
        else:
            dispatcher.utter_message(text="How can I help you further?")

        return []


class ActionAdvancedDirections(Action):
    def name(self) -> Text:
        return "action_advanced_directions"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any]
    ) -> List[Dict[Text, Any]]:
        """Open directions using Google Maps without another TomTom call."""

        start_location = tracker.get_slot("start_location")
        end_location = tracker.get_slot("end_location")
        selected_station = tracker.get_slot("selected_station")

        if selected_station:
            end_location = selected_station

        if not start_location or not end_location:
            dispatcher.utter_message(
                text=(
                    "🧭 Please provide both start and destination "
                    "to get directions.\n\n"
                    "Example: 'from Richmond to Malvern Central'"
                )
            )
            return []

        maps_url = self._build_maps_link(
            str(start_location),
            str(end_location)
        )

        dispatcher.utter_message(
            json_message={
                "type": "directions",
                "origin": start_location,
                "destination": end_location,
                "distance_km": None,
                "eta_min": None,
                "delay_min": None,
                "instructions": [],
                "maps_url": maps_url,
            }
        )

        dispatcher.utter_message(
            text=(
                f"🗺️ Open Google Maps for directions from "
                f"{start_location} to {end_location}."
            )
        )

        return [
            SlotSet(
                "conversation_context",
                ConversationContexts.GETTING_DIRECTIONS
            ),
            SlotSet("start_location", start_location),
            SlotSet("end_location", end_location),
        ]

    def _build_maps_link(self, origin: str, destination: str) -> str:
        """Create a Google Maps link for directions."""
        origin_enc = quote_plus((origin or "My Location").strip())
        destination_enc = quote_plus((destination or "").strip())
        if destination_enc:
            return (
                f"https://www.google.com/maps/dir/?api=1&origin={origin_enc}"
                f"&destination={destination_enc}&travelmode=driving"
            )
        return f"https://www.google.com/maps/search/?api=1&query={origin_enc}"

class ActionTrafficInfo(Action):
    def name(self) -> Text:
        return "action_traffic_info"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        """Provide live traffic conditions for the current or selected route."""
        start_location = tracker.get_slot("start_location")
        end_location = tracker.get_slot("end_location")
        selected_station = tracker.get_slot("selected_station")

        if selected_station and not end_location:
            end_location = selected_station

        if not start_location or not end_location:
            dispatcher.utter_message(
                text=(
                    "🚦 To show traffic, I need a route.\n\n"
                    "Provide it like: 'from Richmond to Malvern Central'"
                )
            )
            return []

        # Show "your current location" instead of raw GPS coordinates
        import re as _re
        start_label = "your current location" if _re.match(r'^\(?\s*-?\d+\.\d+\s*,\s*-?\d+\.\d+\s*\)?$', str(start_location).strip()) else start_location

        if REAL_TIME_INTEGRATION_AVAILABLE and real_time_manager:
            try:
                traffic = real_time_manager.get_traffic_conditions(
                    start_location, end_location
                )
                if traffic:
                    status = traffic.get("traffic_status", "Unknown")
                    congestion = traffic.get("congestion_level")
                    delay_min = traffic.get("estimated_delay_minutes")
                    current_speed = traffic.get("current_speed_kmh")
                    free_flow_speed = traffic.get("free_flow_speed_kmh")

                    details: List[str] = []
                    details.append(f"🚦 Traffic: {start_label} → {end_location}")
                    details.append(f"• Status: {status}")
                    if congestion is not None:
                        details.append(f"• Congestion level: {congestion}")
                    if isinstance(delay_min, (int, float)) and delay_min >= 0:
                        details.append(f"• Estimated delay: {int(delay_min)} min")
                    if isinstance(current_speed, (int, float)) and isinstance(free_flow_speed, (int, float)):
                        details.append(
                            f"• Speed: {int(current_speed)} km/h (free-flow {int(free_flow_speed)} km/h)"
                        )

                    dispatcher.utter_message(text="\n".join(details))
                    dispatcher.utter_message(text=Messages.GOODBYE)
                    return [SlotSet("conversation_context", ConversationContexts.ENDED)]
            except Exception as e:
                print(f"Error in ActionTrafficInfo: {e}")

        dispatcher.utter_message(
            text=f"🚦 Real-time traffic to {end_location} is unavailable right now.\n\n"
                 f"You can still tap **Get Directions** on any station card to navigate there."
        )
        return []

class ActionEnhancedChargerInfo(Action):
    def name(self) -> Text:
        return "action_enhanced_charger_info"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        selected_station = tracker.get_slot("selected_station")

        if not selected_station:
            dispatcher.utter_message(
                text="❌ Please select a charging station first from the list above."
            )
            return []

        try:
            details = data_service.get_station_details(selected_station)
            if not details:
                dispatcher.utter_message(
                    text=f"❌ I couldn't find details for '{selected_station}'. Please pick another station."
                )
                return []

            response = (
                f"🔌 **{details.get('name', selected_station)}**\n\n"
                f"📍 **Address:** {details.get('address', 'Address available')}\n"
                f"⚡ **Power:** {details.get('power', 'Power info available')}\n"
                f"🔌 **Points:** {details.get('points', 'Points info available')}\n"
                f"💰 **Cost:** {details.get('cost', 'Cost info available')}\n"
                f"🕐 **Charging time:** {details.get('charging_time', 'Time estimate available')}\n"
            )

            dispatcher.utter_message(text=response)
            return []
        except Exception as e:
            print(f"Error in ActionEnhancedChargerInfo: {e}")
            dispatcher.utter_message(
                text="❌ Unable to fetch charger details right now."
            )
            return []
        
class ActionEnhancedPreferenceFiltering(Action):
    def name(self) -> Text:
        return "action_enhanced_preference_filtering"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any]
    ) -> List[Dict[Text, Any]]:
        conversation_context = tracker.get_slot("conversation_context")

        if conversation_context in [
            ConversationContexts.ROUTE_PLANNING_RESULTS,
            ConversationContexts.STATION_DETAILS,
        ]:
            try:
                return ActionHandleRouteStationSelection().run(dispatcher, tracker, domain)
            except Exception as e:
                print(f"Error forwarding to route station selection from preference filter action: {e}")
                return []

        if conversation_context in [
            ConversationContexts.EMERGENCY_RESULTS,
            ConversationContexts.EMERGENCY_CHARGING,
        ]:
            try:
                return ActionHandleEmergencyStationSelection().run(dispatcher, tracker, domain)
            except Exception as e:
                print(f"Error forwarding to emergency station selection from preference filter action: {e}")
                return []

        if conversation_context in [
            ConversationContexts.PREFERENCE_CHARGING,
            ConversationContexts.PREFERENCE_RESULTS,
        ]:
            dispatcher.utter_message(
                text=(
                    "❌ Preference-based filtering is unavailable right now. "
                    "This feature will be added later."
                )
            )
            return [SlotSet("conversation_context", ConversationContexts.ENDED)]

        return []

class ActionContextualHelp(Action):

    def name(self):
        return "action_contextual_help"

    def run(self, dispatcher, tracker, domain):
        context = tracker.get_slot("conversation_context")

        if context == "route_planning":
            dispatcher.utter_message(
                text="You are currently in route planning. Please provide your starting location and destination so I can help find suitable EV charging stations for your trip."
            )

        elif context == "emergency_charging":
            dispatcher.utter_message(
                text="You are currently using emergency charging support. Please provide your current location and charger type so I can help find nearby charging options."
            )

        elif context == "preference_charging":
            dispatcher.utter_message(
                text="You are currently using preference-based charging. You can choose options such as cheapest, fastest, or premium charging stations."
            )

        else:
            dispatcher.utter_message(
                text="I can help you with EV route planning, nearby charging stations, emergency charging, traffic information, and directions. You can type 'plan a route', 'find a charger', or 'explain route planning'."
            )


class ActionNearbyStations(Action):
    def name(self) -> Text:
        return "action_nearby_stations"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any]
    ) -> List[Dict[Text, Any]]:
        location = tracker.get_slot("current_location")

        entities = tracker.latest_message.get("entities", []) or []
        for ent in entities:
            if ent.get("entity") == "current_location" and ent.get("value"):
                location = ent.get("value")
                break

        user_lat = tracker.get_slot("user_lat")
        user_lng = tracker.get_slot("user_lng")

        stations: List[Dict[str, Any]] = []

        try:
            if location:
                coords = data_service._get_location_coordinates(location)
                if coords:
                    stations = data_service.get_emergency_stations_from_coordinates(coords)
            elif user_lat is not None and user_lng is not None:
                stations = data_service.get_emergency_stations_from_coordinates((user_lat, user_lng))
        except Exception as e:
            dispatcher.utter_message(text=f"Error finding nearby stations: {str(e)}")
            return []

        if stations:
            _send_station_cards(dispatcher, stations, limit=5)

            response = "Here are some nearby charging stations:\n\n"
            for i, station in enumerate(stations[:5], 1):
                name = station.get("name", f"Station {i}")
                dist = station.get("distance_km")

                if isinstance(dist, (int, float)):
                    response += f"{i}. {name} - {dist:.1f} km away\n"
                else:
                    response += f"{i}. {name}\n"

            response += "\nType the station name if you want more details."
            dispatcher.utter_message(text=response)

            return [
                SlotSet("displayed_stations", stations[:5]),
                SlotSet("conversation_context", ConversationContexts.STATION_DETAILS),
            ]

        dispatcher.utter_message(
            text="I couldn't find nearby charging stations for that location. Try another suburb like Richmond or Carlton."
        )
        return []
    
# ============================================================
# ALL YOUR ORIGINAL ACTIONS (UNCHANGED)
# ============================================================

# (To save space, I am not repeating them here — keep everything exactly as in your file)

# ============================================================
# NEW ACTIONS FOR INTERRUPT + RESUME FLOW
# ============================================================

class ActionStorePreviousContext(Action):
    def name(self) -> Text:
        return "action_store_previous_context"

    def run(self, dispatcher, tracker, domain):
        current_context = tracker.get_slot("conversation_context")
        return [SlotSet("previous_context", current_context)]


class ActionRestorePreviousContext(Action):
    def name(self) -> Text:
        return "action_restore_previous_context"

    def run(self, dispatcher, tracker, domain):
        prev = tracker.get_slot("previous_context")
        return [SlotSet("conversation_context", prev)]


class ActionCongestionPrediction(Action):
    def name(self) -> Text:
        return "action_congestion_prediction"

    def run(self, dispatcher, tracker, domain):

        # Lấy location từ entity
        location = tracker.get_slot("location")

        if not location:
            dispatcher.utter_message(
                text="Which location would you like a congestion prediction for?"
            )
            return []

        # Demo prediction
        prediction = 0.78

        dispatcher.utter_message(
            text=f"⚡ Predicted congestion level for **{location}** is **{prediction*100:.0f}%** in the next 30 minutes."
        )

        # ================================
        # ⭐ XÁC ĐỊNH START LOCATION
        # ================================
        start_location = None

        # 1) Nếu đang ở route planning → dùng start_location slot
        if tracker.get_slot("start_location"):
            start_location = tracker.get_slot("start_location")

        # 2) Nếu có current_location (initial location) → dùng
        elif tracker.get_slot("current_location"):
            start_location = tracker.get_slot("current_location")

        # 3) Nếu có user_lat/lng → dùng toạ độ
        elif tracker.get_slot("user_lat") and tracker.get_slot("user_lng"):
            start_location = (
                tracker.get_slot("user_lat"),
                tracker.get_slot("user_lng")
            )

        # 4) Nếu không có start → báo lỗi
        if not start_location:
            dispatcher.utter_message(
                text="I need your starting location to find charging stations."
            )
            return []

        # ================================
        # ⭐ GỌI LẠI ROUTE PLANNING
        # ================================
        try:
            stations = data_service.get_route_stations(
                start_location,
                location
            )

            if stations:
                _send_station_cards(dispatcher, stations, limit=20)

                response = f"⚡ Found {len(stations)} charging stations from **{start_location}** to **{location}**:\n\n"
                for i, station in enumerate(stations[:20]):
                    response += f"**{i+1}. {station.get('name')}**\n"
                    response += f"⚡ {station.get('power')} | 💰 {station.get('cost')}\n\n"

                response += "Type a station name to choose one."

                dispatcher.utter_message(text=response)

                return [
                    SlotSet("start_location", start_location),
                    SlotSet("end_location", location),
                    SlotSet("conversation_context", ConversationContexts.ROUTE_PLANNING_RESULTS),
                    SlotSet("displayed_stations", stations[:20]),
                ]

            else:
                dispatcher.utter_message(
                    text=f"⚡ No charging stations found for route to {location}."
                )
                return []

        except Exception:
            dispatcher.utter_message(
                text="⚠️ Error retrieving stations for this location."
            )
            return [
                SlotSet("start_location", start_location),
                SlotSet("end_location", location),
                SlotSet("conversation_context", ConversationContexts.ROUTE_PLANNING_RESULTS),
                SlotSet("previous_context", ConversationContexts.ROUTE_PLANNING_RESULTS)
            ]


