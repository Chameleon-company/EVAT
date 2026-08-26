import { useState, useEffect } from "react";
import { Search, Mic, MicOff, Loader2 } from "lucide-react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const API_URL = import.meta.env.VITE_API_URL;

const buildVoiceQueryEndpoint = () => {
  const baseUrl = (API_URL || "").replace(/\/+$/, "");

  if (baseUrl.endsWith("/api")) {
    return `${baseUrl}/voice/query`;
  }

  return `${baseUrl}/api/voice/query`;
};

const getUserLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 30000,
      }
    );
  });

function VoiceQuery({ onQueryResult }) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    setIsRecording(listening);
  }, [listening]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="w-full">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Sorry, your browser does not support speech recognition.
          Please use Chrome, Edge, or Safari.
        </div>
      </div>
    );
  }

  const handleMicrophoneClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      setIsRecording(false);
      return;
    }

    setError("");
    resetTranscript();

    SpeechRecognition.startListening({
      continuous: true,
      language: "en-US",
    });

    setIsRecording(true);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      setError("Please enter or speak your query");
      return;
    }

    if (listening) {
      SpeechRecognition.stopListening();
      setIsRecording(false);
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const userLocation = await getUserLocation();

      const response = await fetch(buildVoiceQueryEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          user_location: userLocation,
        }),
      });

      const rawText = await response.text();

      let data = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch (parseError) {
        data = null;
      }

      if (!response.ok) {
        setResult(null);

        const serverMessage =
          data?.message ||
          (rawText && rawText.trim()) ||
          `Request failed (${response.status})`;

        setError(serverMessage);
        return;
      }

      setResult(data || null);

      if (onQueryResult) {
        onQueryResult({
          ...data,
          user_location: userLocation,
        });
      }

      console.log("Intent:", data.intent);
      console.log("Entities:", data.entities);
      console.log("Station ID:", data.station_id);
    } catch (err) {
      console.error("Error querying voice API:", err);

      setResult(null);
      setError(
        "Network error or server not responding, please try again later"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResult(null);
    setError("");
    resetTranscript();

    if (listening) {
      SpeechRecognition.stopListening();
      setIsRecording(false);
    }
  };

  const applyQuickSuggestion = (text) => {
    setQuery(text);
    setError("");
    setResult(null);
  };

  return (
    <div className="w-full">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Voice Query Assistant
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Ask about nearby chargers, cost, or congestion status.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit}>
          {/* Search Input */}
          <div className="relative">
            <Search
              size={20}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Try: nearest charger, cheapest station, or low congestion"
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-14 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {/* Microphone Button */}
            <button
              type="button"
              onClick={handleMicrophoneClick}
              disabled={loading}
              title={
                listening ? "Stop recording" : "Start voice input"
              }
              aria-label={
                listening ? "Stop recording" : "Start voice input"
              }
              className={`absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg transition-all duration-200 ${
                isRecording
                  ? "bg-red-500 text-white shadow-md hover:bg-red-600"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {listening ? (
                <MicOff size={19} />
              ) : (
                <Mic size={19} />
              )}
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => applyQuickSuggestion("nearest charger")}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Nearest
            </button>

            <button
              type="button"
              onClick={() => applyQuickSuggestion("cheapest station")}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Cheapest
            </button>

            <button
              type="button"
              onClick={() => applyQuickSuggestion("low congestion")}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Low congestion
            </button>
          </div>

          {/* Recording Indicator */}
          {listening && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              Recording... Please speak
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Querying...
                </>
              ) : (
                "Submit Query"
              )}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {/* Result Header */}
            <div className="border-b border-slate-200 bg-white px-4 py-3">
              <h3 className="text-base font-bold text-slate-900">
                Query Result
              </h3>
            </div>

            {/* Result Content */}
            <div className="p-4">
              <p className="text-sm leading-6 text-slate-700">
                {result.answer_text}
              </p>

              <div className="mt-3 text-xs text-slate-500">
                Based on current system estimation.
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>
                  <strong className="font-semibold text-slate-800">
                    Intent:
                  </strong>{" "}
                  {result.intent || "N/A"}
                </p>

                <p>
                  <strong className="font-semibold text-slate-800">
                    Congestion:
                  </strong>{" "}
                  {result.entities?.congestion ||
                    result.entities?.congestion_level ||
                    "N/A"}
                </p>

                <p>
                  <strong className="font-semibold text-slate-800">
                    Station ID:
                  </strong>{" "}
                  {result.station_id || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VoiceQuery;