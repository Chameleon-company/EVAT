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

        <div class="flex items-center gap-3">

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
                🚦
            </div>


            <div>

                <h3 class="font-semibold text-white">
                    Traffic
                </h3>

                <p class="text-xs text-gray-400">
                    ${escapeTrafficText(status)}
                </p>

            </div>

        </div>


        ${
            message
                ? `
                    <p class="mt-3 text-sm text-gray-300">
                        ${escapeTrafficText(message)}
                    </p>
                  `
                : ""
        }


        ${
            delay !== undefined &&
            delay !== null
                ? `
                    <div class="mt-2 text-xs text-gray-400">
                        Delay:
                        ${escapeTrafficText(delay)}
                    </div>
                  `
                : ""
        }

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