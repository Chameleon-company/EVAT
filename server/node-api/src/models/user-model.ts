import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  // Depending on how the user was created it may not have any first, last, or full name values.
  // This makes relying on any of these requiring default values
  firstName?: string;
  lastName?: string;
  fullName?: string;
  mobile?: string;
  role: "user" | "admin";
  paymentInfo?: {
    cardNumber: string;
    expiryDate: string;
    cvv: { type: String },
    billingAddress: string;
  };
  refreshToken: string | null;
  refreshTokenExpiresAt: Date | null;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    firstName: { type: String }, lastName: { type: String }, fullName: { type: String },
    mobile: {
      type: String,
      validate: {
        validator: function (v: string) {
          // Allow empty (optional) or Australian format 04XXXXXXXX
          return !v || /^04\d{8}$/.test(v);
        },
        message: "Mobile number must have 10 digits starting with 04.",
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // ⚠️ Not safe for real apps
    paymentInfo: {
      cardNumber: { type: String },
      expiryDate: { type: String },
      cvv: { type: String },
      billingAddress: { type: String }
    },
    refreshToken: {
      type: String,
      default: null,
    },
    refreshTokenExpiresAt: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = mongoose.model<IUser>("User", UserSchema, "users");

export default User;
