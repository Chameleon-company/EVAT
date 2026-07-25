import mongoose, { Schema, Document } from "mongoose";

export interface IProfile extends Document {
  user_id: string;
  user_car_model: string;
  favourite_stations: Array<string>;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema: Schema = new Schema<IProfile>(
  {
    user_id: {
      type: String,
      required: [true, "userId is required"],
      unique: true,
    },
    user_car_model: { type: String },
    favourite_stations: { type: [] },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
    versionKey: false, // Disable __v field
  }
);

const Profile = mongoose.model<IProfile>("Profile", ProfileSchema, "profiles");

export default Profile;
