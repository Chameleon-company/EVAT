/**
 * Choices offered when describing a vehicle for a price estimate. They mirror the
 * categories in the Price Prediction training data, so a value outside them reaches
 * the model as something it has never seen. Shared by the Price Prediction page and
 * the chatbot so the two cannot drift apart.
 */
export const BRAND_MODELS = {
  Audi: ["A3", "A4", "Q5", "Q7"],
  BMW: ["3 Series", "5 Series", "X3", "X5"],
  Ford: ["Explorer", "Fiesta", "Focus", "Mustang"],
  Honda: ["Accord", "CR-V", "Civic", "Fit"],
  Mercedes: ["C-Class", "E-Class", "GLA", "GLC"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y"],
  Toyota: ["Camry", "Corolla", "Prius", "RAV4"],
};

export const FUEL_TYPES = ["Diesel", "Electric", "Hybrid", "Petrol"];
export const TRANSMISSIONS = ["Automatic", "Manual"];
export const CONDITIONS = ["Like New", "New", "Used"];

export const formatAud = (value) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value || 0);
