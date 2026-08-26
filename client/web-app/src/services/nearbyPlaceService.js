const API_URL = import.meta.env.VITE_API_URL;
const baseUrl = `${API_URL}/nearby-places`;

const parseResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const withQuery = (options = {}) => {
  const { radiusKm = 1, category } = options;
  const queryParams = new URLSearchParams({
    radiusKm: String(radiusKm),
  });
  if (category && category !== "all") {
    queryParams.set("category", category);
  }
  return queryParams;
};

export const getPlacePhotoUrl = (photoName) => {
  if (!photoName) return null;
  return `${baseUrl}/photo?name=${encodeURIComponent(photoName)}`;
};

export const getPlacesForStation = async (stationId, options = {}) => {
  const response = await fetch(`${baseUrl}/station/${stationId}?${withQuery(options)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return parseResponse(response);
};

export const getNearbyPlaces = async (latitude, longitude, options = {}) => {
  const queryParams = withQuery(options);
  queryParams.set("lat", String(latitude));
  queryParams.set("lon", String(longitude));

  const response = await fetch(`${baseUrl}?${queryParams}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return parseResponse(response);
};
