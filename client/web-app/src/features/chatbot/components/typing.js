function showTypingIndicator() {
    const chat =
        document.getElementById("chat");

    if (!chat) return;


    if (
        document.getElementById(
            "typing-indicator"
        )
    ) {
        return;
    }


    const typing =
        document.createElement("div");

    typing.id =
        "typing-indicator";

    typing.className =
        "flex justify-start mb-4";


    typing.innerHTML = `
        <div class="rounded-2xl rounded-bl-md
                    border border-white/10
                    bg-white/5 px-4 py-3
                    backdrop-blur-xl">

            <div class="flex items-center gap-1">

                <span
                    class="h-2 w-2 rounded-full
                           bg-emerald-400
                           animate-bounce">
                </span>

                <span
                    class="h-2 w-2 rounded-full
                           bg-emerald-400
                           animate-bounce"
                    style="animation-delay: 120ms">
                </span>

                <span
                    class="h-2 w-2 rounded-full
                           bg-emerald-400
                           animate-bounce"
                    style="animation-delay: 240ms">
                </span>

            </div>
        </div>
    `;


    chat.appendChild(typing);

    scrollToBottom();
}


function hideTypingIndicator() {
    const typing =
        document.getElementById(
            "typing-indicator"
        );

    if (typing) {
        typing.remove();
    }
}