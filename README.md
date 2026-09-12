# EVAT – Electric Vehicle Adoption Tools

A conversational AI chatbot designed to help electric vehicle users find charging stations, plan routes, and get relevant information. The chatbot is now powered by **Qwen3 (via Ollama)** with EV charging tools (station search, availability, routing), with the original **Rasa** chatbot kept running as a fallback if the Qwen service is unavailable.

## 🌐 Live Demo
The EVAT Chatbot is now deployed online and accessible via Netlify: https://t2-rasa-chatbpt-2025.netlify.app/

**About the live demo:**
- Users can access the chatbot directly from a browser without local setup.
- All main flows—Route Planning, Emergency Charging, and Charging Preferences—are fully interactive.
- The bot detects the user’s location (via browser geolocation) for a starting point.
- Station cards display filtered charging stations with Get Directions, Check Availability, and Compare Options buttons.
- Real-time traffic information is provided via TomTom APIs for accurate route planning.
- The live demo is ideal for testing and showcasing the chatbot functionality.

---

## 🚀 Features
- **Location-based charging station finder**
- **Emergency Charging mode** → asks for car model or connector type (CHAdeMO, Tesla Model 3, Type 2, CCS) and returns compatible nearby stations (within ~10 km).
- **Real-time, traffic-aware routing** (powered by TomTom API)
- **Charging preferences with station cards** → users can filter by:
  - Fastest (high-speed chargers)
  - Cheapest (budget-friendly)
  - Premium (well-equipped/high-rated)
- **Interactive station cards** with:
  - Station details (name, suburb, coordinates, charger type)
  - Buttons for Get Directions, Check Availability, and Compare Options
  - Google Maps integration for live traffic and routes
- **Web-based chat interface**

---

## 📁 Project Structure
EVAT/
├── backend/                    # Core business logic
│   ├── llm/                    # Qwen/Ollama LLM API, service, providers, prompts and tools
│   │   ├── api.py               # Flask app exposing /health and /api/chat
│   │   ├── service.py            # LLM service (chat + tool calling)
│   │   ├── tools.py              # EV charging/routing tools used by the LLM
│   │   ├── prompts.py, models.py, config.py, providers/
│   ├── utils/                   # Backend utilities
│   ├── real_time_apis.py         # TomTom client
│   ├── openchargeapi.py          # Open Charge Map client
│   └── ...                       # Other station/route/availability services
├── frontend/                    # Chatbot web UI
│   ├── chat.html                 # Main chat interface
│   ├── js/
│   │   ├── chatbot-api.js         # Qwen-first API connection with Rasa fallback
│   │   └── app.js                 # Frontend app logic
│   ├── cards/                    # Station, directions and traffic response cards
│   ├── chat/, ui/, location/     # Chat history, input/typing UI, geolocation helpers
├── rasa/                        # Existing Rasa chatbot (now used as fallback)
│   ├── domain.yml, config.yml, endpoints.yml, credentials.yml
│   ├── actions/                  # Custom action implementations
│   └── data/                     # Training data (intents, stories, rules)
├── data/                        # Datasets
│   └── raw/                      # CSV files (charging stations, coordinates)
├── .env.example                 # Example environment configuration
├── requirements.txt             # Python dependencies
└── README.md                    # Project overview

---

## 🧩 How to Use the Chatbot (Local Setup)

### 1. Install dependencies
From the repo root:
```
pip install -r requirements.txt
```

### 2. Environment variables
Copy the example file:
```
cp .env.example .env
```
API keys and config values are read from `.env`. Key variables include:
- `TOMTOM_API_KEY` – used for routing/traffic
- `OPENCHARGEMAP_API_KEY` – used for charging station data
- `LLM_PROVIDER`, `LLM_MODEL`, `LLM_TIMEOUT_SECONDS`, `LLM_TEMPERATURE`, `OLLAMA_BASE_URL` – Qwen/Ollama settings

Fill in your own values — do not commit real API keys.

### 3. Ollama
[Ollama](https://ollama.com) must be installed and running locally. Pull the model configured in `.env.example`:
```
ollama pull qwen3:4b-instruct
```
By default Ollama is expected at `http://127.0.0.1:11434`.

### 4. Qwen API
Run the LLM API from the repo root:
```
python -m backend.llm.api
```
This starts the Flask app on `http://localhost:8000`:
- Health check: `GET http://localhost:8000/health`
- Chat endpoint: `POST http://localhost:8000/api/chat`

### 5. Frontend
Run from the repo root:
```
python3 -m http.server 8080 --directory frontend
```
Open `http://localhost:8080` in your browser and go to `chat.html`. The frontend sends chat messages to the Qwen API first.

### 6. Rasa fallback (optional)
Rasa is kept as a fallback chatbot, not the primary one. If the Qwen API is unreachable, the frontend automatically falls back to:
```
http://localhost:5005/webhooks/rest/webhook
```
To use the fallback, the Rasa server (and actions server) must be running separately — see the `rasa/` folder for its configuration. If Rasa isn't running, the fallback attempt will also fail and the chatbot will show a connection error.

**Note:**
- Ensure Python 3.8+ is installed and accessible in your system path.
- Use a virtual environment for Python dependencies if you prefer.

---

## 🎮 Interact with the Bot
When you start chatting, the bot detects your location or asks for your starting suburb. You then choose a destination.

Main conversation flows:

1. **🗺️ Route Planning – plan charging stops for a journey**  
- Bot suggests chargers within ~10 km of current location.

2. **🚨 Emergency Charging – find nearest compatible station when battery is low**  
Flow:  
1. User selects Emergency Charging.  
2. Bot asks: “Tell me your car model or connector type (CHAdeMO, Type 2, CCS, Tesla Model 3, etc.)”  
3. Bot finds compatible stations within ~10 km of current location.  
4. Station cards displayed with Get Directions (Google Maps), Check Availability, Compare Options.

3. **⚡ Charging Preferences – Filter Chargers by Preference**  
The user selects one of the following preferences: Cheapest, Premium, Fastest

Flow:  
1. The chatbot asks the user to select a preference (Cheapest, Premium, or Fastest).  
2. The system determines the user’s location (from browser geolocation).  
3. Based on the selected preference, the chatbot filters available charging stations near the user’s location.  
4. The filtered results are displayed as station cards, each containing:  
   - Station name, suburb, and charger type  
   - Distance from user’s location  
   - Buttons for: Get Directions (opens Google Maps with real-time traffic), Check Availability, Compare Options  
5. The user can select any station card to proceed with navigation or availability checks.

---

## ⚙️ How It Works
- Browser/frontend (`frontend/js/chatbot-api.js`) sends the user's message and location metadata to the Qwen Flask API (`backend/llm/api.py`).
- The Qwen LLM service (`backend/llm/service.py`) processes the message and can call EV charging tools (`backend/llm/tools.py`) for things like nearby stations, availability, and routing.
- Those tools use TomTom (routing/traffic) and Open Charge Map (station data) where configured.
- Station resolution: Names/suburbs → coordinates via CSV dataset.
- If the Qwen API is unavailable, the frontend falls back to the existing Rasa chatbot instead.

---

## 🖥️ Frontend (Current State)
- Chat UI sends messages to the Qwen API first; Rasa is used as a fallback if Qwen is unavailable.
- Structured tool results from the chatbot are rendered as response cards.
- Current response card components: station cards, directions cards, and traffic cards (`frontend/cards/`).
- Station cards include a Get Directions button that links to Google Maps where supported.

**Current limitations:**
- Only works in Melbourne Metropolitan area.

---

## 📍 Data Sources
- `data/raw/Co-ordinates.csv` → suburb coordinates  
- `data/raw/charger_info_mel.csv` → charging station details
  
---
## Future Development
- Continue improving chatbot reliability and tool handling.
- Expand charging data coverage.
- Maintain/update documentation as integrations change.
- Continue UI/UX improvements.
  
