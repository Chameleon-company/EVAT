const API_URL = import.meta.env.VITE_API_URL;
const baseUrl = `${API_URL}/nearby-places`;

const getAuthToken = (token) => {
  if (token) return token;
  try {
    return (
      JSON.parse(localStorage.getItem("currentUser"))?.token ||
      JSON.parse(localStorage.getItem("user"))?.token ||
      null
    );
  } catch {
    return null;
  }
};

const authHeaders = (token) => {
  const authToken = getAuthToken(token);
  if (!authToken) {
    throw new Error("Unauthorized: missing access token.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };
};

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

export const getPlacesForStation = async (stationId, options = {}) => {
  const { token, signal, ...query } = options;
  const response = await fetch(`${baseUrl}/station/${stationId}?${withQuery(query)}`, {
    method: "GET",
    headers: authHeaders(token),
    signal,
  });
  return parseResponse(response);
};

export const getNearbyPlaces = async (latitude, longitude, options = {}) => {
  const { token, signal, ...query } = options;
  const queryParams = withQuery(query);
  queryParams.set("lat", String(latitude));
  queryParams.set("lon", String(longitude));

  const response = await fetch(`${baseUrl}?${queryParams}`, {
    method: "GET",
    headers: authHeaders(token),
    signal,
  });
  return parseResponse(response);
};

export const fetchPlacePhotoObjectUrl = async (photoName, options = {}) => {
  if (!photoName) return null;
  const { token, signal } = options;
  const response = await fetch(`${baseUrl}/photo?name=${encodeURIComponent(photoName)}`, {
    method: "GET",
    headers: authHeaders(token),
    signal,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
