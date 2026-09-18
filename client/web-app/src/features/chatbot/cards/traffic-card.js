function escapeTrafficText(value) {

    if (value == null) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function addTrafficCard(
    data = {}
) {

    const chat =
        document.getElementById(
            "chat"
        );


    if (!chat) {
        return;
    }


    const row =
        document.createElement(
            "div"
        );

    row.className =
        `
        evat-in
        mb-5
        flex
        items-start
        gap-3
        `;


    const avatar =
        document.createElement(
            "div"
        );

    avatar.className =
        `
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
        `;

    avatar.textContent =
        "⚡";


    const card =
        document.createElement(
            "div"
        );


    card.className =
        `
        relative
        w-full
        max-w-[90%]
        overflow-hidden
        rounded-[22px]
        border
        border-white/[0.09]
        bg-white/[0.045]
        p-4
        shadow-[0_18px_50px_rgba(0,0,0,0.28)]
        backdrop-blur-2xl
        `;


    const status =
        data.status ||
        data.condition ||
        "Traffic information";


    const message =
        data.message ||
        data.description ||
        "";


    const delay =
        data.delay ??
        data.delay_minutes;


    card.innerHTML = `

        <div class="pointer-events-none absolute inset-x-0 top-0 h-px
                    bg-gradient-to-r from-transparent via-white/20 to-transparent">
        </div>

        <div class="relative flex items-center gap-3">

            <div
                class="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-emerald-300/15
                    bg-emerald-400/[0.06]
                    text-lg
                    text-emerald-300
                    shadow-[0_0_25px_rgba(16,185,129,0.06)]
                    backdrop-blur-xl
                "
            >
                🚦
            </div>

            <div>

                <h3 class="text-sm font-semibold tracking-[-0.01em] text-white">
                    Traffic
                </h3>

                <p class="mt-0.5 text-xs text-white/40">
                    ${escapeTrafficText(status)}
                </p>

            </div>

        </div>


        ${
            message
                ? `
                    <p class="relative mt-3 text-sm leading-6 text-white/80">
                        ${escapeTrafficText(message)}
                    </p>
                  `
                : ""
        }


        ${
            delay !== undefined &&
            delay !== null
                ? `
                    <div class="relative mt-3">
                        <span class="rounded-full border border-amber-400/20
                                     bg-amber-400/[0.07] px-2.5 py-1
                                     text-[10px] font-medium tracking-wide text-amber-300">
                            Delay: ${escapeTrafficText(delay)}
                        </span>
                    </div>
                  `
                : ""
        }
    `;


    row.append(
        avatar,
        card
    );


    chat.appendChild(
        row
    );


    if (
        typeof persistChat ===
        "function"
    ) {

        persistChat();
    }


    scrollToBottom();
}
