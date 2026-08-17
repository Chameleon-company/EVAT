const API_URL = import.meta.env.VITE_API_URL;

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "All") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** GET /api/reliability/health */
export const getReliabilityHealth = async () => {
  const response = await fetch(`${API_URL}/reliability/health`);
  return handleResponse(response);
};

/** GET /api/reliability/suburbs */
export const getReliabilitySuburbs = async (token) => {
  const response = await fetch(`${API_URL}/reliability/suburbs`, {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse(response);
};

/** GET /api/reliability/summary */
export const getReliabilitySummary = async (token, params = {}) => {
  const response = await fetch(
    `${API_URL}/reliability/summary${buildQuery(params)}`,
    {
      method: "GET",
      headers: authHeaders(token),
    }
  );
  return handleResponse(response);
};

/** GET /api/reliability/stations */
export const getReliabilityStations = async (token, params = {}) => {
  const response = await fetch(
    `${API_URL}/reliability/stations${buildQuery(params)}`,
    {
      method: "GET",
      headers: authHeaders(token),
    }
  );
  return handleResponse(response);
};

/** GET /api/reliability/stations/:id */
export const getReliabilityStation = async (token, chargerId) => {
  const response = await fetch(
    `${API_URL}/reliability/stations/${encodeURIComponent(chargerId)}`,
    {
      method: "GET",
      headers: authHeaders(token),
    }
  );
  return handleResponse(response);
};

/** GET /api/reliability/top */
export const getReliabilityTop = async (token, params = {}) => {
  const response = await fetch(
    `${API_URL}/reliability/top${buildQuery(params)}`,
    {
      method: "GET",
      headers: authHeaders(token),
    }
  );
  return handleResponse(response);
};

/** POST /api/reliability/score */
export const scoreReliabilityStation = async (token, payload) => {
  const response = await fetch(`${API_URL}/reliability/score`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

/** POST /api/reliability/sentiment */
export const analyzeReliabilitySentiment = async (token, text) => {
  const response = await fetch(`${API_URL}/reliability/sentiment`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ text }),
  });
  return handleResponse(response);
};
