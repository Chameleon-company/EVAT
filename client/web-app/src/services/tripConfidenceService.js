const API_URL = import.meta.env.VITE_API_URL;

export const getTripConfidence = async (payload, token) => {
  const response = await fetch(`${API_URL}/predict/trip-confidence`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};
