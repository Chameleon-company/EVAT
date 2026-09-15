# EVAT Chatbot Assistant: Architecture and Integration

For installation, configuration, and local run instructions, see the [chatbot README](../server/python-services/chatbot/README.md).

## 1. System Architecture and Evolution

### 1.1 Rasa to LLM orchestration

The primary conversational layer uses Qwen3 through Ollama, while the existing Rasa implementation remains isolated as a fallback.

Key architectural features include:

- Dynamic context parsing for charging constraints, connector types, and geographic requests.
- Local LLM inference through Ollama. Chat prompts are processed locally, but location and routing data may be sent to configured services such as TomTom and Open Charge Map when their tools are used.
- Structured tool calls that convert conversational requests into typed parameters for EVAT services.

## 2. Decoupled Service Architecture

The backend is organized under `server/python-services/chatbot/`, and the browser client assets are under `client/web-app/src/features/chatbot/`.

### 2.1 Nearby station discovery

The nearby-station tool uses the requested or browser-provided coordinates to query configured charging-station sources. Results are filtered and ranked by distance. The normal nearby-search radius is configurable and currently defaults to 8 km.

### 2.2 Emergency charging

`emergency_charging.py` provides a low-battery flow that prioritizes nearby charging options. Its search radius is configurable and currently defaults to 15 km.

### 2.3 Route-based recommendations

`route_planning.py` obtains route geometry from TomTom when available and filters candidate stations by their distance from that route. A fallback route is used when TomTom route geometry is unavailable.

### 2.4 Station details and live availability

`station_details.py` and `availability.py` coordinate station metadata and availability results. Open Charge Map supplies station information, while TomTom live availability is requested using TomTom’s availability identifier and parsed from each connector’s `availability.current` counts.

Because the providers use unrelated station identifiers, their records must not be joined without a sufficiently reliable station match.

## 3. Frontend UI and Conversational Client

The standalone chatbot page is `client/web-app/chat.html`. Its feature modules provide:

- Station, directions, and traffic cards.
- Availability badges and Google Maps directions links.
- Conversation history, suggestion chips, and typing indicators.
- Browser geolocation metadata for current-location requests.
- Explicit queried origins for directions when the user names a starting location.

The monorepo’s existing `client/web-app/index.html` remains unchanged.

## 4. API Reliability and Error Handling

The Flask API validates that requests contain a message and returns structured `400` responses for invalid requests and known LLM-service failures.

External service and geocoding failures are handled so the chatbot can return a useful response instead of terminating unexpectedly.

## 5. Tests and Validation

The chatbot includes tests for tool argument handling, nearby-station behaviour, and route filtering:

- `tests/test_tools.py`
- `tests/test_nearby_stations.py`
- `tests/test_route_planning.py`

The client and backend should be tested together with Ollama and the configured TomTom and Open Charge Map credentials before release.

## 6. Future Development

1. Add deeper connector and hardware filtering, such as CCS2, CHAdeMO, and Type 2.
2. Add stateful multi-turn context for follow-up requests.
3. Improve fuzzy matching for colloquial station, suburb, and landmark names.
4. Strengthen cross-provider station matching with coordinate, name, and address safeguards.