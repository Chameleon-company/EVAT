const API_URL = import.meta.env.VITE_API_URL;

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

/** POST /api/predict/price → POST /predict */
export const predictPrice = async (features, rowId) => {
  const response = await fetch(`${API_URL}/predict/price`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features, row_id: rowId }),
  });
  return handleResponse(response);
};

/** POST /api/predict/price/batch → POST /predict/batch */
export const predictPriceBatch = async (records) => {
  const response = await fetch(`${API_URL}/predict/price/batch`, {
    method: "POST",
    credentials: "include", 
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records }),
  });
  return handleResponse(response);
};

/** GET /api/predict/price/schema → GET /schema */
export const getPriceSchema = async () => {
  const response = await fetch(`${API_URL}/predict/price/schema`, {
    method: "GET",
    credentials: "include", 
  });
  return handleResponse(response);
};

/** GET /api/predict/price/model/info → GET /model/info */
export const getPriceModelInfo = async () => {
  const response = await fetch(`${API_URL}/predict/price/model/info`, {
    method: "GET",
    credentials: "include", 
  });
  return handleResponse(response);
};

/** GET /api/predict/price/health → GET /health */
export const getPriceHealth = async () => {
  const response = await fetch(`${API_URL}/predict/price/health`);
  return handleResponse(response);
};
