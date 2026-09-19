const API_URL = import.meta.env.VITE_API_URL;

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
export const getReliabilitySuburbs = async () => {
  const response = await fetch(`${API_URL}/reliability/suburbs`, {
    method: "GET",
    credentials: "include", 
  });
  return handleResponse(response);
};

/** GET /api/reliability/summary */
export const getReliabilitySummary = async (params = {}) => {
  const response = await fetch(
    `${API_URL}/reliability/summary${buildQuery(params)}`,
    {
      method: "GET",
      credentials: "include", 
    }
  );
  return handleResponse(response);
};

/** GET /api/reliability/stations */
export const getReliabilityStations = async ( params = {}) => {
  const response = await fetch(
    `${API_URL}/reliability/stations${buildQuery(params)}`,
    {
      method: "GET",
      credentials: "include", 
    }
  );
  return handleResponse(response);
};

/** GET /api/reliability/stations/:id */
export const getReliabilityStation = async ( chargerId) => {
  const response = await fetch(
    `${API_URL}/reliability/stations/${encodeURIComponent(chargerId)}`,
    {
      method: "GET",
      credentials: "include", 
    }
  );
  return handleResponse(response);
};

/** GET /api/reliability/top */
export const getReliabilityTop = async ( params = {}) => {
  const response = await fetch(
    `${API_URL}/reliability/top${buildQuery(params)}`,
    {
      method: "GET",
      credentials: "include", 
    }
  );
  return handleResponse(response);
};

/** POST /api/reliability/score */
export const scoreReliabilityStation = async (payload) => {
  const response = await fetch(`${API_URL}/reliability/score`, {
    method: "POST",
    credentials: "include", 
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

/** POST /api/reliability/sentiment */
export const analyzeReliabilitySentiment = async (text) => {
  const response = await fetch(`${API_URL}/reliability/sentiment`, {
    method: "POST",
    credentials: "include", 
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return handleResponse(response);
};
