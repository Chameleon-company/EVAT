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


    const card =
        document.createElement(
            "div"
        );


    card.className =
        `
        mb-4
        rounded-2xl
        border
        border-emerald-400/20
        bg-white/5
        p-4
        backdrop-blur-xl
        shadow-lg
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

        <div class="flex items-center gap-3 mb-4">

            <div
                class="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-emerald-500/10
                    text-emerald-400
                "
            >
                🧭
            </div>

            <div>

                <h3 class="font-semibold text-white">
                    Directions
                </h3>

                <p class="text-xs text-gray-400">
                    Route information
                </p>

            </div>

        </div>


        <div class="space-y-3 text-sm">

            <div>

                <div class="text-xs text-gray-500">
                    From
                </div>

                <div class="text-gray-200">
                    ${escapeCardText(from)}
                </div>

            </div>


            <div>

                <div class="text-xs text-gray-500">
                    To
                </div>

                <div class="text-gray-200">
                    ${escapeCardText(to)}
                </div>

            </div>


            ${
                distance
                    ? `
                        <div class="text-xs text-gray-400">
                            Distance:
                            ${escapeCardText(distance)}
                        </div>
                      `
                    : ""
            }


            ${
                duration
                    ? `
                        <div class="text-xs text-gray-400">
                            Estimated time:
                            ${escapeCardText(duration)}
                        </div>
                      `
                    : ""
            }

        </div>
    `;


    chat.appendChild(
        card
    );


    if (
        typeof persistChat ===
        "function"
    ) {

        persistChat();
    }


    scrollToBottom();
}