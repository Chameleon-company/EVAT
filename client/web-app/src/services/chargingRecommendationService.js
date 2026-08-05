import { fetchJson } from "./http";

export const getChargingRecommendations = (latitude, longitude) => {
  return fetchJson("/charger-recommendations", {
    method: "POST",
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
      body: {
        stationId,
      },
    }
  );
};
