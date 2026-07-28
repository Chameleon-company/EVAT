import mongoose, { Schema, Document } from "mongoose";

// counter interface for tracking stats that increment
export interface ICounters {
  totalChargeTimeSeconds: number;
  totalWhCharged: number;
  totalMetresTravelled: number;
  totalCO2KgAvoided: number;
  totalBookings: number;
  totalChargersUsed: number;
  totalChargingSessions: number;
  totalPetrolSavingsCents: number;
  totalChargingCostsCents: number;
  totalReviewsWritten: number;
  totalRatingsGiven: number;
  totalFaultReports: number;
  yearsJoined: number;
  totalLoginDays: number;
  consecutiveLoginDays: number;
  // add new counters here in the future
}

// flag interface for tracking stats that only happen once
export interface IFlags {
  setProfilePic: boolean;
  useSmartFilter: boolean;
  useChatBot: boolean;
  setProfileVehicle: boolean;
  saveFavouriteCharger: boolean;
  postReview: boolean;
  giveRating: boolean;
  useTeslaNetwork: boolean;
  useEvieNetwork: boolean;
  christmasDayCharge: boolean;
  earthDayCharge: boolean;
  winterSolsticeCharge: boolean;
  summerSolsticeCharge: boolean;
  autumalEquinoxCharge: boolean;
  springEquinoxCharge: boolean;
  // add new flags here in the future
}

// user stat interface
export interface IUserStats extends Document {
  userId: string;
  counters: ICounters;
  flags: IFlags;
  lastUpdated: Date;
}

// schema
const UserStatsSchema: Schema = new Schema<IUserStats>(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
      unique: true,
      index: true,  // helps with frequent queries
    },
    counters: {
      type: {
        totalChargeTimeSeconds: { type: Number, default: 0 },
        totalWhCharged: { type: Number, default: 0 },
        totalMetresTravelled: { type: Number, default: 0 },
        totalCO2KgAvoided: { type: Number, default: 0 },
        totalBookings: { type: Number, default: 0 },
        totalChargersUsed: { type: Number, default: 0 },
        totalChargingSessions: { type: Number, default: 0 },
        totalPetrolSavingsCents: { type: Number, default: 0 },
        totalChargingCostsCents: { type: Number, default: 0 },
        totalReviewsWritten: { type: Number, default: 0 },
        totalRatingsGiven: { type: Number, default: 0 },
        totalFaultReports: { type: Number, default: 0 },
        yearsJoined: { type: Number, default: 0 },
        totalLoginDays: { type: Number, default: 0 },
        consecutiveLoginDays: { type: Number, default: 0 },
      },
      default: {},
      _id: false, // doesn't need an id
    },
    flags: {
      type: {
        setProfilePic: { type: Boolean, default: false },
        useSmartFilter: { type: Boolean, default: false },
        useChatBot: { type: Boolean, default: false },
        setProfileVehicle: { type: Boolean, default: false },
        saveFavouriteCharger: { type: Boolean, default: false },
        postReview: { type: Boolean, default: false },
        giveRating: { type: Boolean, default: false },
        useTeslaNetwork: { type: Boolean, default: false },
        useEvieNetwork: { type: Boolean, default: false },
        christmasDayCharge: { type: Boolean, default: false },
        earthDayCharge: { type: Boolean, default: false },
        winterSolsticeCharge: { type: Boolean, default: false },
        summerSolsticeCharge: { type: Boolean, default: false },
        autumalEquinoxCharge: { type: Boolean, default: false },
        springEquinoxCharge: { type: Boolean, default: false },
      },
      default: {},
      _id: false, // doesn't need an id
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false, 
    // no timestamps because we control lastUpdated manually in the repository
  }
);

const UserStats = mongoose.model<IUserStats>("UserStats", UserStatsSchema, "user_stats");

export default UserStats;