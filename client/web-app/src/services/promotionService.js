const API_URL = import.meta.env.VITE_API_URL;
const baseUrl = `${API_URL}/promotions`;

const parseResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Get promotions near a charging station
 * @param {string} stationId
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export const getPromotionsForStation = async (stationId, options = {}) => {
  const { radiusKm = 0.8, category, includeFallbacks = true } = options;
  const queryParams = new URLSearchParams({
    radiusKm: String(radiusKm),
    includeFallbacks: String(includeFallbacks),
  });
  if (category && category !== "all") {
    queryParams.set("category", category);
  }

  const response = await fetch(`${baseUrl}/station/${stationId}?${queryParams}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return parseResponse(response);
};

/**
 * Get promotions near a lat/lng
 * @param {number} latitude
 * @param {number} longitude
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export const getNearbyPromotions = async (latitude, longitude, options = {}) => {
  const { radiusKm = 0.8, category, stationId, includeFallbacks = true } = options;
  const queryParams = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    radiusKm: String(radiusKm),
    includeFallbacks: String(includeFallbacks),
  });
  if (category && category !== "all") {
    queryParams.set("category", category);
  }
  if (stationId) {
    queryParams.set("stationId", stationId);
  }

  const response = await fetch(`${baseUrl}/nearby?${queryParams}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return parseResponse(response);
};
