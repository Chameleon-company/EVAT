const CHAT_HISTORY_KEY = "chatHistory";


function persistChat() {
    const chat = document.getElementById("chat");

    if (!chat) return;

    localStorage.setItem(
        CHAT_HISTORY_KEY,
        chat.innerHTML
    );
}


function restoreChat() {
    const chat = document.getElementById("chat");

    if (!chat) return;

    const history =
        localStorage.getItem(CHAT_HISTORY_KEY);

    if (!history) return;

    chat.innerHTML = history;

    if (
        typeof attachStationDirectionsHandlers ===
        "function"
    ) {
        attachStationDirectionsHandlers();
    }

    if (
        typeof attachQuickReplyHandlers ===
        "function"
    ) {
        attachQuickReplyHandlers();
    }

    scrollToBottom();
}


function clearChatHistory() {
    const chat = document.getElementById("chat");

    if (!chat) return;

    chat.innerHTML = "";

    localStorage.removeItem(
        CHAT_HISTORY_KEY
    );
}