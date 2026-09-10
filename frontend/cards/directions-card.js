function escapeCardText(value) {

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


function addDirectionsCard(
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


    const from =
        data.from ||
        data.start ||
        "Starting location";


    const to =
        data.to ||
        data.destination ||
        "Destination";


    const distance =
        data.distance ||
        data.distance_km;


    const duration =
        data.duration ||
        data.duration_minutes ||
        data.travel_time;


    card.innerHTML = `

        <div class="pointer-events-none absolute inset-x-0 top-0 h-px
                    bg-gradient-to-r from-transparent via-white/20 to-transparent">
        </div>

        <div class="relative flex items-center gap-3 mb-4">

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
                🧭
            </div>

            <div>

                <h3 class="text-sm font-semibold tracking-[-0.01em] text-white">
                    Directions
                </h3>

                <p class="mt-0.5 text-xs text-white/40">
                    Route information
                </p>

            </div>

        </div>


        <div class="relative grid grid-cols-2 gap-2">

            <div
                class="
                    rounded-xl
                    border
                    border-white/[0.06]
                    bg-black/[0.14]
                    p-2.5
                    backdrop-blur-xl
                "
            >
                <p class="text-[10px] font-medium uppercase tracking-wider text-white/25">
                    From
                </p>

                <p class="mt-1 text-xs font-medium text-white/80">
                    ${escapeCardText(from)}
                </p>
            </div>

            <div
                class="
                    rounded-xl
                    border
                    border-white/[0.06]
                    bg-black/[0.14]
                    p-2.5
                    backdrop-blur-xl
                "
            >
                <p class="text-[10px] font-medium uppercase tracking-wider text-white/25">
                    To
                </p>

                <p class="mt-1 text-xs font-medium text-white/80">
                    ${escapeCardText(to)}
                </p>
            </div>

        </div>


        ${
            distance || duration
                ? `
                    <div class="relative mt-3 flex flex-wrap gap-2">

                        ${
                            distance
                                ? `
                                    <span class="rounded-full border border-white/[0.08]
                                                 bg-white/[0.035] px-2.5 py-1
                                                 text-[10px] font-medium tracking-wide text-white/50">
                                        Distance: ${escapeCardText(distance)}
                                    </span>
                                  `
                                : ""
                        }

                        ${
                            duration
                                ? `
                                    <span class="rounded-full border border-emerald-400/20
                                                 bg-emerald-400/[0.07] px-2.5 py-1
                                                 text-[10px] font-medium tracking-wide text-emerald-300">
                                        Est. time: ${escapeCardText(duration)}
                                    </span>
                                  `
                                : ""
                        }

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
