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

/** POST /api/predict/price → POST /predict */
export const predictPrice = async (features, token, rowId) => {
  const response = await fetch(`${API_URL}/predict/price`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ features, row_id: rowId }),
  });
  return handleResponse(response);
};

/** POST /api/predict/price/batch → POST /predict/batch */
export const predictPriceBatch = async (records, token) => {
  const response = await fetch(`${API_URL}/predict/price/batch`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ records }),
  });
  return handleResponse(response);
};

/** GET /api/predict/price/schema → GET /schema */
export const getPriceSchema = async (token) => {
  const response = await fetch(`${API_URL}/predict/price/schema`, {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse(response);
};

/** GET /api/predict/price/model/info → GET /model/info */
export const getPriceModelInfo = async (token) => {
  const response = await fetch(`${API_URL}/predict/price/model/info`, {
    method: "GET",
    headers: authHeaders(token),
  });
  return handleResponse(response);
};

/** GET /api/predict/price/health → GET /health */
export const getPriceHealth = async () => {
  const response = await fetch(`${API_URL}/predict/price/health`);
  return handleResponse(response);
};
