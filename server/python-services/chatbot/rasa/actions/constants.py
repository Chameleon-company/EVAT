# Simplified constants for the 3 main EV charging journeys

class ConversationContexts:
    # Initial location collection context
    INITIAL_LOCATION_COLLECTION = "initial_location_collection"

    # Main journey contexts
    ROUTE_PLANNING = "route_planning"
    EMERGENCY_CHARGING = "emergency_charging"
    PREFERENCE_CHARGING = "preference_charging"

    # Result contexts
    ROUTE_PLANNING_RESULTS = "route_planning_results"
    EMERGENCY_RESULTS = "emergency_results"
    PREFERENCE_RESULTS = "preference_results"
    STATION_DETAILS = "station_details"

    GETTING_DIRECTIONS = "getting_directions"
    COMPARING_STATIONS = "comparing_stations"
    CHECKING_AVAILABILITY = "checking_availability"

    # Terminal context
    ENDED = "ended"

    # Station selection contexts
    ROUTE_STATION_SELECTION = "route_station_selection"
    EMERGENCY_STATION_SELECTION = "emergency_station_selection"
    PREFERENCE_STATION_SELECTION = "preference_station_selection"


class MainMenuOptions:
    ROUTE_PLANNING = "1. **Route Planning** - Plan charging stops for your journey"
    EMERGENCY_CHARGING = "2. **Emergency Charging** - Find nearest stations when battery is low"
    CHARGING_PREFERENCES = "3. **Charging Preferences** - Find stations by your preferences (fast, cheap, etc.)"
    INSTRUCTIONS = "What would you like to do?"


class PreferenceTypes:
    CHEAPEST = "cheapest"
    FASTEST = "fastest"
    PREMIUM = "premium"


class ActionTypes:
    GET_DIRECTIONS = "directions"
    COMPARE_OPTIONS = "compare"
    CHECK_AVAILABILITY = "availability"


class Messages:
    GREETING = "Hello! Welcome to Melbourne EV Charging Assistant! ⚡"
    MAIN_MENU = (
        "Please select an option:\n\n"
        "1. 🗺️ **Route Planning** - Plan charging stops for your journey\n"
        "2. 🚨 **Emergency Charging** - Find nearest stations when battery is low\n"
        "3. ⚡ **Charging Preferences** - Find stations by your preferences\n\n"
        "**🎯 Type 1, 2, or 3 to continue!**"
    )
    ROUTE_PLANNING_PROMPT = "Great! Let's plan your charging route. Where are you traveling from and to?"
    EMERGENCY_PROMPT = "Emergency charging assistance! 🚨 Where are you currently located?"
    PREFERENCE_PROMPT = "Let me help you find stations based on your preferences! What's most important to you?"
    STATION_SELECTION_PROMPT = "Which station would you like to know more about?"
    ACTION_CHOICE_PROMPT = "\n1. Get directions to this station\n2. Compare with other options\n3. Check current availability"
    GOODBYE = "Goodbye! Have a great journey! 🚗⚡"


class ErrorMessages:
    LOCATION_NOT_FOUND = "❌ I can't find charging stations in {location}."
    NO_STATIONS_FOUND = "❌ No charging stations found in your area."
    UNCLEAR_RESPONSE = "I'm not sure what you'd like to do. Please choose from the options above."
    INVALID_SELECTION = "Please choose a valid option (1, 2, or 3)."
