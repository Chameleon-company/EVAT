/**
 * EVAT CHATBOT APP
 * Main application controller.
 *
 * UI rendering is handled by the modular files:
 * - chat/messages.js
 * - chat/chips.js
 * - cards/*.js
 * - ui/*.js
 * - location/location.js
 * - js/chatbot-api.js
 */


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const typingIndicator = document.getElementById("typing-indicator");
const clearBtn = document.getElementById("clear-btn");


/* =========================================================
   INPUT STATE
   ========================================================= */

let baseInputHeight = null;

const MAX_INPUT_HEIGHT = 120;


/* =========================================================
   RASA RESPONSE HANDLER
   ========================================================= */

function handleChatbotResponse(messages) {

    if (!Array.isArray(messages)) {
        console.warn(
            "Invalid Rasa response:",
            messages
        );

        return;
    }


    messages.forEach((msg) => {

        /* -------------------------------------------------
           NORMAL TEXT RESPONSE
           ------------------------------------------------- */

        if (msg.text) {

            addMessage(
                msg.text,
                "bot"
            );
        }


        /* -------------------------------------------------
           CUSTOM RESPONSE PAYLOAD
           ------------------------------------------------- */

        const payload =
            msg.custom ||
            msg.json_message ||
            null;


        if (
            !payload ||
            typeof payload !== "object"
        ) {
            return;
        }


        /* -------------------------------------------------
           DIRECTIONS CARD
           ------------------------------------------------- */

        if (
            payload.type === "directions"
        ) {

            if (
                typeof addDirectionsCard ===
                "function"
            ) {

                addDirectionsCard(
                    payload
                );

            } else {

                console.warn(
                    "addDirectionsCard() is not available."
                );
            }

            return;
        }


        /* -------------------------------------------------
           TRAFFIC CARD
           ------------------------------------------------- */

        if (
            payload.type === "traffic"
        ) {

            if (
                typeof addTrafficCard ===
                "function"
            ) {

                addTrafficCard(
                    payload
                );

            } else {

                console.warn(
                    "addTrafficCard() is not available."
                );
            }

            return;
        }


        /* -------------------------------------------------
           STATION CARDS
           ------------------------------------------------- */

        if (
            Array.isArray(
                payload.stations
            )
        ) {

            if (
                typeof addStationCards ===
                "function"
            ) {

                addStationCards(
                    payload.stations,
                    {
                        show_availability:
                            !!payload.show_availability
                    }
                );

            } else {

                console.warn(
                    "addStationCards() is not available."
                );
            }
        }

    });
}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage(message) {

    if (!message) {
        return;
    }


    /* Show typing indicator */

    if (typingIndicator) {

        typingIndicator.classList.remove(
            "hidden"
        );
    }


    try {

        /* Send message to Rasa */

        const data =
            await sendChatMessage(
                message,
                "user",
                userLocation || {}
            );


        /* Handle empty response */

        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            addMessage(
                "Sorry, I didn’t understand that.",
                "bot"
            );

        } else {

            /* Process Rasa response */

            handleChatbotResponse(
                data
            );
        }


    } catch (error) {

        console.error(
            "Error sending chatbot message:",
            error
        );


        addMessage(
            "Server error. Please try again.",
            "bot"
        );


    } finally {

        /* Hide typing indicator */

        if (typingIndicator) {

            typingIndicator.classList.add(
                "hidden"
            );
        }
    }
}


/* =========================================================
   INITIAL CHAT
   ========================================================= */

async function sendLocation() {

    try {

        const data =
            await sendChatMessage(
                "hello",
                "user",
                userLocation || {}
            );


        if (
            Array.isArray(data) &&
            data.length > 0
        ) {

            handleChatbotResponse(
                data
            );
        }


    } catch (error) {

        console.error(
            "Error sending initial chatbot request:",
            error
        );


        addMessage(
            "Unable to connect to EVAT right now.",
            "bot"
        );
    }
}


/* =========================================================
   PAGE INITIALISATION
   ========================================================= */

window.addEventListener(
    "load",
    async () => {

        console.log(
            "EVAT frontend starting..."
        );


        /* -----------------------------------------------
           Start with empty chat
           ----------------------------------------------- */

        if (chat) {

            chat.innerHTML = "";
        }


        /* -----------------------------------------------
           Input height
           ----------------------------------------------- */

        if (userInput) {

            userInput.style.height =
                "auto";

            baseInputHeight =
                userInput.scrollHeight;
        }


        /* -----------------------------------------------
           Resolve browser location
           ----------------------------------------------- */

        try {

            await resolveUserLocation();

            console.log(
                "User location:",
                userLocation
            );

        } catch (error) {

            console.warn(
                "Location unavailable. Rasa will ask for suburb.",
                error
            );
        }


        /* -----------------------------------------------
           Start chatbot
           ----------------------------------------------- */

        await sendLocation();
    }
);


/* =========================================================
   FORM SUBMIT
   ========================================================= */

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const message =
            userInput.value.trim();


        if (!message) {

            return;
        }


        /* -----------------------------------------------
           Display user message
           ----------------------------------------------- */

        addMessage(
            message,
            "user"
        );


        /* -----------------------------------------------
           Clear input
           ----------------------------------------------- */

        userInput.value = "";

        userInput.style.height =
            baseInputHeight
                ? `${baseInputHeight}px`
                : "auto";


        /* -----------------------------------------------
           Send message
           ----------------------------------------------- */

        await sendMessage(
            message
        );
    }
);


/* =========================================================
   TEXTAREA RESIZE
   ========================================================= */

userInput.addEventListener(
    "input",
    () => {

        if (
            baseInputHeight == null
        ) {

            userInput.style.height =
                "auto";

            baseInputHeight =
                userInput.scrollHeight;
        }


        userInput.style.height =
            `${baseInputHeight}px`;


        const needed =
            Math.min(
                MAX_INPUT_HEIGHT,
                userInput.scrollHeight
            );


        if (
            needed >
            baseInputHeight + 2
        ) {

            userInput.style.height =
                `${needed}px`;
        }
    }
);


/* =========================================================
   ENTER TO SEND
   ========================================================= */

userInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            form.requestSubmit();
        }
    }
);


/* =========================================================
   CLEAR CHAT
   ========================================================= */

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        () => {

            if (
                !confirm(
                    "Clear all chat messages?"
                )
            ) {

                return;
            }


            chat.innerHTML = "";

            localStorage.removeItem(
                "chatHistory"
            );


            addMessage(
                "Chat cleared. How can I help you now?",
                "bot"
            );
        }
    );
}