import mongoose, { Schema, Document } from "mongoose";

export interface IPersonalisedEVInsights extends Document {
  userId: string;
  email: string;
  weekly_km: number;
  trip_length: string;
  driving_frequency: string;
  driving_type: string;
  road_trips: string;
  car_ownership: string;
  fuel_efficiency: number;
  monthly_fuel_spend: number;
  home_charging: string;
  solar_panels: string;
  charging_preference: string;
  budget: string;
  priorities: string;
  postcode: string;

  cluster: number | null;
  profileType?: string;
  description?: string;
  estimatedSavings?: number;
  savingsMessage?: string;

  similarDriverAverages?: {
    weekly_km: number;
    fuel_efficiency: number;
    monthly_fuel_spend: number;
  };

  allDriverAverages?: {
    weekly_km: number;
    fuel_efficiency: number;
    monthly_fuel_spend: number;
  };

  comparison?: {
    sim_weekly_km_difference: number;
    sim_fuel_efficiency_difference: number;
    sim_monthly_fuel_spend_difference: number;
    all_weekly_km_difference: number;
    all_fuel_efficiency_difference: number;
    all_monthly_fuel_spend_difference: number;
  };

  evReadinessScore?: number;
  recommendationCategory?: string;
  annualKm?: number;
  estimatedAnnualFuelCost?: number;
  estimatedAnnualEvChargingCost?: number;
  estimatedAnnualSavings?: number;
  estimatedAnnualCo2ReductionKg?: number;
  personalisedPredictionInsight?: string;
  scoreComponents?: {
    drivingDemand: number;
    financialBenefit: number;
    chargingPracticality: number;
    solarAccess: number;
    environmentalPriority: number;
    budgetReadiness: number;
    roadTripPenalty: number;
  };
  assumptions?: {
    chargingProfile: string;
    evEnergyKwhPerKm: number;
    evCostPerKm: number;
    electricityCo2KgPerKwh: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const PersonalisedEVInsightsSchema: Schema = new Schema<IPersonalisedEVInsights>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      maxlength: [255, "Email cannot exceed 255 characters"],
    },
    weekly_km: {
      type: Number,
      required: [true, "Weekly km is required"],
      min: [0, "Weekly km cannot be negative"],
    },
    trip_length: {
      type: String,
      required: [true, "Trip length is required"],
      trim: true,
    },
    driving_frequency: {
      type: String,
      required: [true, "Driving frequency is required"],
      trim: true,
    },
    driving_type: {
      type: String,
      required: [true, "Driving type is required"],
      trim: true,
    },
    road_trips: {
      type: String,
      required: [true, "Road trips field is required"],
      trim: true,
    },
    car_ownership: {
      type: String,
      required: [true, "Car ownership is required"],
      trim: true,
    },
    fuel_efficiency: {
      type: Number,
      required: [true, "Fuel efficiency is required"],
      min: [0, "Fuel efficiency cannot be negative"],
    },
    monthly_fuel_spend: {
      type: Number,
      required: [true, "Monthly fuel spend is required"],
      min: [0, "Monthly fuel spend cannot be negative"],
    },
    home_charging: {
      type: String,
      required: [true, "Home charging is required"],
      trim: true,
    },
    solar_panels: {
      type: String,
      required: [true, "Solar panels field is required"],
      trim: true,
    },
    charging_preference: {
      type: String,
      required: [true, "Charging preference is required"],
      trim: true,
    },
    budget: {
      type: String,
      required: [true, "Budget is required"],
      trim: true,
    },
    priorities: {
      type: String,
      required: [true, "Priorities are required"],
      trim: true,
    },
    postcode: {
      type: String,
      required: [true, "Postcode is required"],
      trim: true,
      maxlength: [10, "Postcode too long"],
    },

    cluster: {
      type: Number,
      default: null,
    },
    profileType: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    estimatedSavings: {
      type: Number,
      default: 0,
    },
    savingsMessage: {
      type: String,
      default: "",
      trim: true,
    },
    similarDriverAverages: {
      weekly_km: { type: Number, default: 0 },
      fuel_efficiency: { type: Number, default: 0 },
      monthly_fuel_spend: { type: Number, default: 0 },
    },
    allDriverAverages: {
      weekly_km: { type: Number, default: 0 },
      fuel_efficiency: { type: Number, default: 0 },
      monthly_fuel_spend: { type: Number, default: 0 }      
    },
    comparison: {
      sim_weekly_km_difference: { type: Number, default: 0 },
      sim_fuel_efficiency_difference: { type: Number, default: 0 },
      sim_monthly_fuel_spend_difference: { type: Number, default: 0 },
      all_weekly_km_difference: { type: Number, default: 0 },
      all_fuel_efficiency_difference: { type: Number, default: 0 },
      all_monthly_fuel_spend_difference: { type: Number, default: 0 },
    },
    evReadinessScore: {
      type: Number,
      min: [0, "EV readiness score cannot be negative"],
      max: [100, "EV readiness score cannot exceed 100"],
      default: 0,
    },
    recommendationCategory: {
      type: String,
      enum: ["Full EV Recommended", "Hybrid Recommended", "EV Optional"],
      default: "EV Optional",
    },
    annualKm: { type: Number, min: 0, default: 0 },
    estimatedAnnualFuelCost: { type: Number, min: 0, default: 0 },
    estimatedAnnualEvChargingCost: { type: Number, min: 0, default: 0 },
    estimatedAnnualSavings: { type: Number, min: 0, default: 0 },
    estimatedAnnualCo2ReductionKg: { type: Number, min: 0, default: 0 },
    personalisedPredictionInsight: {
      type: String,
      default: "",
      trim: true,
    },
    scoreComponents: {
      drivingDemand: { type: Number, default: 0 },
      financialBenefit: { type: Number, default: 0 },
      chargingPracticality: { type: Number, default: 0 },
      solarAccess: { type: Number, default: 0 },
      environmentalPriority: { type: Number, default: 0 },
      budgetReadiness: { type: Number, default: 0 },
      roadTripPenalty: { type: Number, default: 0 },
    },
    assumptions: {
      chargingProfile: { type: String, default: "public" },
      evEnergyKwhPerKm: { type: Number, default: 0.18 },
      evCostPerKm: { type: Number, default: 0.07 },
      electricityCo2KgPerKwh: { type: Number, default: 0.65 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// collection name: personalised_ev_insights
const PersonalisedEVInsights = mongoose.model<IPersonalisedEVInsights>(
  "PersonalisedEVInsights",
  PersonalisedEVInsightsSchema,
  "personalised_ev_insights"
);

export default PersonalisedEVInsights;
