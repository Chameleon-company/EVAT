import { useState } from 'react';
import { Mic, X } from 'lucide-react';
import VoiceQuery from './VoiceQuery';


function FloatingVoiceAssistant({ onQueryResult }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleAssistant = () => {
        setIsOpen((prev) => !prev);
    };

    return (
        <div className="fixed bottom-110px right-6 z-9999">
            {isOpen && (
                <div className="absolute right-0 bottom-[76px] w-[400px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] animate-in fade-in slide-in-from-bottom-3 duration-200">
                    <div className="flex items-center justify-between bg-gradient-to-br from-slate-900 to-slate-800 px-[18px] py-4 text-white">
                        <div>
                            <h3 className="text-base font-bold">EV Charging Assistant</h3>
                            <div className="mt-1 text-xs opacity-80">
                                Ask by text or voice
                            </div>
                        </div>

                        <button
                            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                            onClick={toggleAssistant}
                            aria-label="Close voice assistant"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="max-h-[72vh] overflow-y-auto bg-slate-50">
                        <VoiceQuery onQueryResult={onQueryResult} />
                    </div>
                </div>
            )}

            <button
                className="flex h-68px w-68px items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] transition duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_16px_34px_rgba(37,99,235,0.42)] active:translate-y-0 active:scale-[0.98]"
                onClick={toggleAssistant}
                aria-label="Open voice assistant"
                title="Open Voice Assistant"
            >
                <Mic size={26} />
            </button>
        </div>
    );
}

export default FloatingVoiceAssistant;