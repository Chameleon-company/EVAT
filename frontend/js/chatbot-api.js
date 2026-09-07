/* =========================================================
   CHATBOT API
   ========================================================= */

const CHATBOT_API_URL =
    window.CHATBOT_API_URL ||
    "http://localhost:5005";


/* =========================================================
   SEND MESSAGE TO RASA
   ========================================================= */

async function sendChatMessage(
    message,
    sender = "user",
    metadata = {}
) {
    const payload = {
        sender,
        message,
        metadata,
    };

    console.log("Sending request to Rasa:", payload);

    const response = await fetch(
        `${CHATBOT_API_URL}/webhooks/rest/webhook`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify(payload),
        }
    );

    if (!response.ok) {
        throw new Error(
            `Rasa request failed: ${response.status} ${response.statusText}`
        );
    }

    const data = await response.json();

    console.log("Rasa response:", data);

    return data;
}