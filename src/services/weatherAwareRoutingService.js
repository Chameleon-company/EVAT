const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export const predictWeatherAwareRouting = async (payload, token) => {
  const response = await fetch(`${API_URL}/weather-aware-routing/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Failed to fetch prediction");
  }

  return data;
};