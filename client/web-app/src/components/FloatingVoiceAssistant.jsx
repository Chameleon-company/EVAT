import { useState } from "react";
import { Mic, X } from "lucide-react";
import VoiceQuery from "./VoiceQuery";
import { Button } from "./Button";

function FloatingVoiceAssistant({ onQueryResult }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAssistant = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      <div className="fixed bottom-34 right-2 z-11 md:bottom-24 md:right-4">
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
            size-16
            items-center
            justify-center
            rounded-full
            bg-linear-to-br
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
            cursor-pointer
          "
        >
          {isOpen ? <X size={26} /> : <Mic size={26} />}
        </button>
      </div>
      
      {/* =========================
          VOICE ASSISTANT POPUP
      ========================== */}
      {isOpen && (
        <>
          <div className="fixed inset-0 flex items-center justify-center z-102">
            <Button
              className="absolute inset-0 bg-foreground/5 backdrop-blur-xs z-[-1]"
              variant="unstyled"
              onClick={toggleAssistant}
            />
            <div
              className="
                flex
                z-102
                w-full md:max-w-sm
                flex-col
                overflow-hidden
                rounded-2xl
                border
                shadow-[0_24px_60px_rgba(15,23,42,0.22)]
              "
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between px-5 py-4 bg-background text-foreground">
                <div>
                  <h3 className="text-lg font-semibold">
                    EV Charging Assistant
                  </h3>

                  <p className="mt-1 text-xs text-foreground/80">
                    Ask by text or voice
                  </p>
                </div>

                <button
                  className="
                    flex items-center justify-center size-6
                    rounded-md
                    cursor-pointer
                    outline-1 outline-primary/25
                    hover:bg-primary/25
                  "
                  variant="unstyled"
                  onClick={toggleAssistant}
                  aria-label="Close voice assistant"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Voice Query Content */}
              <div className="min-h-0 flex-1 overflow-y-auto bg-background">
                <VoiceQuery onQueryResult={onQueryResult} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default FloatingVoiceAssistant;