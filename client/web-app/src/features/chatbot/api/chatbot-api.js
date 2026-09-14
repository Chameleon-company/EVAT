const QWEN_API_URL =
    window.QWEN_API_URL ||
    "http://localhost:8000";

const RASA_API_URL =
    window.RASA_API_URL ||
    "http://localhost:5005";

async function sendToQwen(
    message,
    sender = "user",
    metadata = {}
) {
    const payload = {
        message,
        sender,
        metadata,
    };

    console.log("Sending request to Qwen3:", payload);

    const response = await fetch(
        `${QWEN_API_URL}/api/chat`,
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
            `Qwen3 request failed: ${response.status} ${response.statusText}`
        );
    }

    const data = await response.json();

    if (!data.ok) {
        throw new Error(
            data.error || "Qwen3 returned an error."
        );
    }

    console.log("Qwen3 response:", data);

    const messages = [];

    if (data.reply) {
        messages.push({
            text: data.reply,
        });
    }

    if (Array.isArray(data.tool_results)) {
        data.tool_results.forEach((result) => {
            if (result && typeof result === "object" && result.type) {
                messages.push({
                    custom: result,
                });
            }
        });
    }

    return messages;
}

async function sendToRasa(
    message,
    sender = "user",
    metadata = {}
) {
    const payload = {
        sender,
        message,
        metadata,
    };

    console.log("Falling back to Rasa:", payload);

    const response = await fetch(
        `${RASA_API_URL}/webhooks/rest/webhook`,
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

async function sendChatMessage(
    message,
    sender = "user",
    metadata = {}
) {
    try {
        return await sendToQwen(
            message,
            sender,
            metadata
        );
    } catch (qwenError) {
        console.warn(
            "Qwen3 unavailable. Falling back to Rasa.",
            qwenError
        );

        try {
            return await sendToRasa(
                message,
                sender,
                metadata
            );
        } catch (rasaError) {
            console.error(
                "Both Qwen3 and Rasa requests failed.",
                rasaError
            );

            throw new Error(
                "Unable to connect to the chatbot."
            );
        }
    }
}
