const API_URL = import.meta.env.VITE_API_URL;

/**
 * Save, change or clear (rating: null) the signed-in user's thumbs up/down on one
 * chatbot reply. PUT /api/chatbot-feedback
 */
export const rateChatbotReply = async ({ messageId, rating, tab, reply, question }) => {
  const response = await fetch(`${API_URL}/chatbot-feedback`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messageId, rating, tab, reply, question }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
};
