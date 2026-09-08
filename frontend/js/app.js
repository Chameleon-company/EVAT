const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const typingIndicator = document.getElementById("typing-indicator");
const clearBtn = document.getElementById("clear-btn");

let baseInputHeight = null;

const MAX_INPUT_HEIGHT = 120;

function handleChatbotResponse(messages) {
    if (!Array.isArray(messages)) {
        console.warn("Invalid chatbot response:", messages);
        return;
    }

    messages.forEach((msg) => {
        if (msg.text) {
            addMessage(msg.text, "bot");
        }

        const payload =
            msg.custom ||
            msg.json_message ||
            null;

        if (!payload || typeof payload !== "object") {
            return;
        }

        if (payload.type === "directions") {
            if (typeof addDirectionsCard === "function") {
                addDirectionsCard(payload);
            } else {
                console.warn("addDirectionsCard() is not available.");
            }

            return;
        }

        if (payload.type === "traffic") {
            if (typeof addTrafficCard === "function") {
                addTrafficCard(payload);
            } else {
                console.warn("addTrafficCard() is not available.");
            }

            return;
        }

        if (Array.isArray(payload.stations)) {
            if (typeof addStationCards === "function") {
                addStationCards(
                    payload.stations,
                    {
                        show_availability: !!payload.show_availability
                    }
                );
            } else {
                console.warn("addStationCards() is not available.");
            }
        }
    });
}

async function sendMessage(message) {
    if (!message) {
        return;
    }

    if (typingIndicator) {
        typingIndicator.classList.remove("hidden");
    }

    try {
        const data = await sendChatMessage(
            message,
            "user",
            userLocation || {}
        );

        if (!Array.isArray(data) || data.length === 0) {
            addMessage(
                "Sorry, I didn't understand that.",
                "bot"
            );
        } else {
            handleChatbotResponse(data);
        }
    } catch (error) {
        console.error("Error sending chatbot message:", error);

        addMessage(
            "Server error. Please try again.",
            "bot"
        );
    } finally {
        if (typingIndicator) {
            typingIndicator.classList.add("hidden");
        }
    }
}

window.addEventListener("load", async () => {
    console.log("EVAT frontend starting...");

    if (chat) {
        chat.innerHTML = "";
    }

    if (userInput) {
        userInput.style.height = "auto";
        baseInputHeight = userInput.scrollHeight;
    }

    try {
        await resolveUserLocation();

        console.log(
            "User location:",
            userLocation
        );
    } catch (error) {
        console.warn(
            "Location unavailable.",
            error
        );
    }

    addMessage(
        "⚡ Hello! I'm EVAT, your EV charging assistant. How can I help you today?",
        "bot"
    );
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = userInput.value.trim();

    if (!message) {
        return;
    }

    addMessage(message, "user");

    userInput.value = "";

    userInput.style.height =
        baseInputHeight
            ? `${baseInputHeight}px`
            : "auto";

    await sendMessage(message);
});

userInput.addEventListener("input", () => {
    if (baseInputHeight == null) {
        userInput.style.height = "auto";
        baseInputHeight = userInput.scrollHeight;
    }

    userInput.style.height = `${baseInputHeight}px`;

    const needed = Math.min(
        MAX_INPUT_HEIGHT,
        userInput.scrollHeight
    );

    if (needed > baseInputHeight + 2) {
        userInput.style.height = `${needed}px`;
    }
});

userInput.addEventListener("keydown", (event) => {
    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {
        event.preventDefault();
        form.requestSubmit();
    }
});

if (clearBtn) {
    clearBtn.addEventListener("click", () => {
        if (!confirm("Clear all chat messages?")) {
            return;
        }

        chat.innerHTML = "";

        localStorage.removeItem("chatHistory");

        addMessage(
            "Chat cleared. How can I help you now?",
            "bot"
        );
    });
}