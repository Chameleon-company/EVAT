import { fetchJson } from "./http";

function getStoredToken() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
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
  return fetchJson("/charger-recommendations", {
    method: "POST",
    headers: authHeaders(),
    body: {
      latitude,
      longitude,
    },
  });
};

export const selectChargingStation = (sessionId, stationId) => {
  return fetchJson(
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
