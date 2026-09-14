import React from "react";
import { MessageCircle } from "lucide-react";

function ChatBubble({ url = "https://example.com" }) {
  const handleClick = () => {
    window.open(url, "_blank");
  };

  return (
    <button
      type="button"
      className="
        fixed
        bottom-5
        right-5
        z-[2000]
        flex
        h-14
        w-14
        items-center
        justify-center
        rounded-full
        border
        border-emerald-500
        bg-emerald-500
        text-white
        shadow-[0_8px_25px_rgba(0,0,0,0.25)]
        transition-all
        duration-200
        hover:-translate-y-1
        hover:scale-105
        hover:bg-emerald-400
        hover:shadow-[0_10px_30px_rgba(16,185,129,0.35)]
        focus:outline-none
        focus:ring-2
        focus:ring-emerald-400
        focus:ring-offset-2
        focus:ring-offset-white

        dark:border-emerald-400
        dark:bg-emerald-500
        dark:text-black
        dark:hover:bg-emerald-400
        dark:focus:ring-emerald-300
        dark:focus:ring-offset-black

        sm:bottom-6
        sm:right-6
      "
      onClick={handleClick}
      aria-label="Open chatbot"
      title="Open chatbot"
    >
      <MessageCircle size={28} strokeWidth={2} />
    </button>
  );
}

export default ChatBubble;