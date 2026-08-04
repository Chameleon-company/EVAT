import { fetchJson } from "./http";

export const getChargingRecommendations = (latitude, longitude) => {
  return fetchJson("/api/charger-recommendations", {
    method: "POST",
    body: {
      latitude,
      longitude,
    },
  });
};

export const selectChargingStation = (sessionId, stationId) => {
  return fetchJson(
    `/api/charger-recommendations/${sessionId}/selection`,
    {
      method: "POST",
      body: {
        stationId,
      },
    }
  );
};