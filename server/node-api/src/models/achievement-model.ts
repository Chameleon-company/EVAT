import mongoose, { Schema, Document } from "mongoose";

export interface IMilestone {
    statType: "counter" | "flag";
    statName: string;           // e.g. "totalChargingSessions", "setProfilePic"
    operator: ">=" | "===";
    targetValue: number | boolean;
}

export interface IAchievement extends Document {
    name: string;
    description: string;
    icon: string;               // URL or filename
    category: string;
    rarity?: "common" | "rare" | "epic";
    points?: number;
    milestone: IMilestone;
    isActive: boolean;
}

const AchievementSchema: Schema = new Schema<IAchievement>({
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    icon: { 
        type: String, 
        required: true 
    },
    category: { 
        type: String, 
        required: true 
    },
    rarity: { 
        type: String, 
        enum: ["common", "rare", "epic"], 
        default: "common" 
    },
    points: { 
        type: Number, 
        default: 10 
    },
    milestone: {
        statType: { type: String, required: true },
        statName: { type: String, required: true },
        operator: { type: String, required: true },
        targetValue: { type: Schema.Types.Mixed, required: true },
    },
    isActive: { type: Boolean, default: true },
}, { versionKey: false });

const Achievement = mongoose.model<IAchievement>("Achievement", AchievementSchema, "achievements");

export default Achievement;