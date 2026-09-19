const API_URL = import.meta.env.VITE_API_URL;

export const getCostComparison = async (payload) => {
  const response = await fetch(`${API_URL}/predict/cost`, { 
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export const getCostCharts = async (payload) => {
    const response = await fetch(`${API_URL}/predict/cost/charts`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
};

export const getEvVehicles = async () => {
    const response = await fetch(`${API_URL}/predict/vehicles/ev`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
};

export const getIceVehicles = async () => {
    const response = await fetch(`${API_URL}/predict/vehicles/ice`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
};

export const getEvEfficiency = async (make, model, variant) => {
    const response = await fetch(`${API_URL}/predict/vehicles/ev/efficiency`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ make, model, variant }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
};

export const getIceEfficiency = async (make, model, variant) => {
    const response = await fetch(`${API_URL}/predict/vehicles/ice/efficiency`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ make, model, variant }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
};