const fetchChargingJson = async (path, { method = "GET", headers = {}, body } = {}) => {
  const base = import.meta.env.VITE_API_URL || "";
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${message || response.statusText}`);
  }

  return response.json();
};

function getStoredToken() {
  try {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    const token = user?.token;
    return typeof token === "string" ? token : token?.accessToken;
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Unauthorized: missing access token.");
  }

  return { Authorization: `Bearer ${token}` };
}

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
