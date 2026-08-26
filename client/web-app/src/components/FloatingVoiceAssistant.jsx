import { useState } from "react";
import { Mic, X } from "lucide-react";
import VoiceQuery from "./VoiceQuery";

function FloatingVoiceAssistant({ onQueryResult }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAssistant = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* =========================
          VOICE ASSISTANT POPUP
      ========================== */}
      {isOpen && (
        <div
          className="
            fixed
            bottom-[92px]
            right-4
            z-[10000]
            flex
            max-h-[calc(100vh-120px)]
            w-[400px]
            max-w-[calc(100vw-32px)]
            flex-col
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-[0_24px_60px_rgba(15,23,42,0.22)]
          "
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between bg-gradient-to-br from-slate-900 to-slate-800 px-5 py-4 text-white">
            <div>
              <h3 className="text-base font-bold">
                EV Charging Assistant
              </h3>

              <p className="mt-1 text-xs text-white/80">
                Ask by text or voice
              </p>
            </div>

            <button
              type="button"
              onClick={toggleAssistant}
              aria-label="Close voice assistant"
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-white/10
                text-white
                transition
                hover:bg-white/20
                focus:outline-none
                focus:ring-2
                focus:ring-white/50
              "
            >
              <X size={18} />
            </button>
          </div>

          {/* Voice Query Content */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50">
            <VoiceQuery onQueryResult={onQueryResult} />
          </div>
        </div>
      )}

      {/* =========================
          FLOATING VOICE BUTTON
      ========================== */}
      <button
        type="button"
        onClick={toggleAssistant}
        aria-label={
          isOpen
            ? "Close voice assistant"
            : "Open voice assistant"
        }
        title={
          isOpen
            ? "Close Voice Assistant"
            : "Open Voice Assistant"
        }
        className="
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-full
          bg-gradient-to-br
          from-blue-600
          to-blue-700
          text-white
          shadow-[0_12px_30px_rgba(37,99,235,0.35)]
          transition-all
          duration-200
          hover:-translate-y-0.5
          hover:scale-[1.03]
          hover:shadow-[0_16px_34px_rgba(37,99,235,0.42)]
          active:translate-y-0
          active:scale-[0.98]
          focus:outline-none
          focus:ring-4
          focus:ring-blue-300/50
        "
      >
        {isOpen ? <X size={26} /> : <Mic size={26} />}
      </button>
    </div>
  );
}

export default FloatingVoiceAssistant;