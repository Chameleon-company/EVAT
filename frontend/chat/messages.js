function timestamp() {
    return new Date().toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

function addMessage(
    text,
    sender = "bot"
) {
    const chat = document.getElementById("chat");

    if (!chat) {
        console.error("Chat container not found.");
        return;
    }

    const row = document.createElement("div");

    row.className =
        sender === "bot"
            ? `
                mb-5
                flex
                items-end
                gap-3
            `
            : `
                mb-5
                flex
                items-end
                justify-end
                gap-3
            `;

    const avatar = document.createElement("div");

    avatar.className =
        sender === "bot"
            ? `
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-emerald-300/20
                bg-emerald-400/[0.08]
                text-sm
                text-emerald-300
                shadow-[0_0_25px_rgba(16,185,129,0.10)]
                backdrop-blur-xl
            `
            : `
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-white/[0.10]
                bg-white/[0.06]
                text-sm
                text-white/70
                backdrop-blur-xl
            `;

    avatar.textContent =
        sender === "bot"
            ? "⚡"
            : "🙂";

    const bubble = document.createElement("div");

    bubble.className =
        sender === "bot"
            ? `
                relative
                max-w-[82%]
                overflow-hidden
                rounded-[20px]
                rounded-bl-md
                border
                border-white/[0.11]
                bg-white/[0.065]
                px-4
                py-3
                text-sm
                leading-6
                text-white/85
                shadow-[0_15px_45px_rgba(0,0,0,0.25)]
                backdrop-blur-2xl
                sm:max-w-[75%]
            `
            : `
                relative
                max-w-[82%]
                overflow-hidden
                rounded-[20px]
                rounded-br-md
                border
                border-emerald-300/25
                bg-emerald-400/[0.12]
                px-4
                py-3
                text-sm
                leading-6
                text-emerald-50
                shadow-[0_15px_45px_rgba(0,0,0,0.28)]
                backdrop-blur-2xl
                sm:max-w-[75%]
            `;

    const highlight = document.createElement("div");

    highlight.className = `
        pointer-events-none
        absolute
        inset-x-0
        top-0
        h-px
        bg-gradient-to-r
        from-transparent
        via-white/20
        to-transparent
    `;

    bubble.appendChild(highlight);

    text = text == null
        ? ""
        : String(text);

    const cleanText = text
        .replace(
            /\*\*(.*?)\*\*/g,
            "$1"
        )
        .replace(
            /`([^`]+)`/g,
            "$1"
        );

    const textElement = document.createElement("div");

    textElement.className =
        "relative whitespace-pre-wrap";

    textElement.textContent = cleanText;

    bubble.appendChild(textElement);

    const time = document.createElement("span");

    time.className =
        sender === "bot"
            ? `
                relative
                mt-2
                block
                text-[10px]
                tracking-wide
                text-white/25
            `
            : `
                relative
                mt-2
                block
                text-[10px]
                tracking-wide
                text-emerald-100/35
            `;

    time.textContent = timestamp();

    bubble.appendChild(time);

    if (sender === "bot") {
        row.append(
            avatar,
            bubble
        );
    } else {
        row.append(
            bubble,
            avatar
        );
    }

    chat.appendChild(row);

    if (typeof persistChat === "function") {
        persistChat();
    }

    if (typeof scrollToBottom === "function") {
        scrollToBottom();
    }

    handleMessageChips(
        cleanText,
        sender
    );
}

function handleMessageChips(
    text,
    sender
) {
    if (sender !== "bot") {
        return;
    }

    if (
        /press|type/i.test(text) &&
        /1.*2.*3|1, 2, or 3/i.test(text)
    ) {
        if (typeof addChips === "function") {
            addChips([
                "1",
                "2",
                "3"
            ]);
        }
    }

    if (
        /what'?s\s+most\s+important\s+to\s+you/i.test(text)
    ) {
        window.showFcpChips = true;
    }

    if (
        window.showFcpChips &&
        /fastest|cheapest|premium/i.test(text) &&
        !/1.*2.*3/.test(text)
    ) {
        if (typeof addChips === "function") {
            addChips([
                "Cheapest",
                "Fastest",
                "Premium"
            ]);
        }

        window.showFcpChips = false;
    }
}

function scrollToBottom() {
    const chat = document.getElementById("chat");

    if (!chat) {
        return;
    }

    requestAnimationFrame(() => {
        chat.scrollTop = chat.scrollHeight;
    });
}