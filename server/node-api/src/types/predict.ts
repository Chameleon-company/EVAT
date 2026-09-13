// All matches the FastAPI PredictionRequest and PredictionResponse in 
// EVAT-Data-Science Demand Forecasting API
export interface PredictionRequestPayload {
    postcode: string;
    date: string;   // in "YYYY-MM-DD" format
}

export interface PythonPredictionResponse {
    postcode: string;
    date: string;
    predicted_demand_kwh: number;
    status: "success" | "error";
}

export interface FormattedPredictionResponse {
  postcode: string;
  date: string;
  predictedDemandKwh: number;
  isFallback: boolean;
  message?: string;
}