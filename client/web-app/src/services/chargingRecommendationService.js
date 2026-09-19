const fetchChargingJson = async (path, { method = "GET", headers = {}, body } = {}) => {
  const base = import.meta.env.VITE_API_URL || "";
  const response = await fetch(`${base}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${message || response.statusText}`);
  }

  return response.json();
};


export const getChargingRecommendations = (latitude, longitude) => {
  return fetchChargingJson("/charger-recommendations", {
    method: "POST",
    headers: authHeaders(),
    body: {
      latitude,
      longitude,
    },
  });
};

export const selectChargingStation = (sessionId, stationId) => {
  return fetchChargingJson(
    `/charger-recommendations/${sessionId}/selection`,
    {
      method: "POST",
      headers: authHeaders(),
      body: {
        stationId,
      },
    }
  );
};
