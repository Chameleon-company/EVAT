import mongoose, { Schema, Document } from "mongoose";

export interface IUserAchievement extends Document {
    userId: string;
    achievementId: string;
    unlockedAt: Date;
    pointsAwarded: number;
}

const UserAchievementSchema: Schema = new Schema<IUserAchievement>({
    userId: { 
        type: String, 
        required: true, 
        index: true 
    },
    achievementId: { 
        type: String, 
        required: true 
    },
    unlockedAt: { 
        type: Date, 
        default: Date.now 
    },
    pointsAwarded: { 
        type: Number, 
        required: true 
    },
}, { versionKey: false });

// Compound index to prevent duplicate unlocks
UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

const UserAchievement = mongoose.model<IUserAchievement>("UserAchievement", UserAchievementSchema, "user_achievements");

export default UserAchievement;