import mongoose, { Schema, Document } from "mongoose";

//================================================
// 1. Game Profile Schema and Model
//================================================

export interface IGameProfile extends Document {
  main_app_user_id: string;
  created_at?: Date;
  gamification_profile: {
    persona: string;
    points_balance: number;
    net_worth: number;
  };
  engagement_metrics: {
    current_app_login_streak: number;
    longest_app_login_streak: number;
    last_login_date: Date;
  };
  contribution_summary: {
    total_check_ins: number;
    total_fault_reports: number;
    total_ai_validations: number;
    total_black_spot_discoveries: number;
    total_route_plans: number;
    total_chatbot_questions: number;
    total_quizzes_correct: number;
    total_easter_eggs_redeemed: number;
    total_virtual_items_purchased: number;
  };
  inventory: {
    badges_earned: mongoose.Types.ObjectId[];
    virtual_items: mongoose.Types.ObjectId[];
  };
  active_quests: mongoose.Types.ObjectId[];
}

const GameProfileSchema: Schema = new Schema<IGameProfile>({
  main_app_user_id: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now },
  gamification_profile: {
    persona: { type: String, default: "ANXIOUS_NEWCOMER" },
    points_balance: { type: Number, default: 0 },
    net_worth: { type: Number, default: 0 },
  },
  engagement_metrics: {
    current_app_login_streak: { type: Number, default: 0 },
    longest_app_login_streak: { type: Number, default: 0 },
    last_login_date: { type: Date },
  },
  contribution_summary: {
    total_check_ins: { type: Number, default: 0 },
    total_fault_reports: { type: Number, default: 0 },
    total_ai_validations: { type: Number, default: 0 },
    total_black_spot_discoveries: { type: Number, default: 0 },
    total_route_plans: { type: Number, default: 0 },
    total_chatbot_questions: { type: Number, default: 0 },
    total_quizzes_correct: { type: Number, default: 0 },
    total_easter_eggs_redeemed: { type: Number, default: 0 },
    total_virtual_items_purchased: { type: Number, default: 0 },
  },
  inventory: {
    badges_earned: [{ type: Schema.Types.ObjectId, ref: 'GameBadge' }],
    virtual_items: [{ type: Schema.Types.ObjectId, ref: 'GameVirtualItem' }],
  },
  active_quests: [{ type: Schema.Types.ObjectId, ref: 'GameQuest' }],
}, { versionKey: false, timestamps: true });

export const GameProfile = mongoose.model<IGameProfile>("GameProfile", GameProfileSchema, "game_profiles");

//================================================
// 2. Game Event Schema and Model
//================================================

export interface IGameEvent extends Document {
  user_id: mongoose.Types.ObjectId;
  session_id: string;
  event_type: "ACTION_PERFORMED" | "QUEST_STATUS_CHANGED" | "POINTS_TRANSACTION";
  action_type?: string;
  timestamp: Date;
  details: object;
}

const GameEventSchema: Schema = new Schema<IGameEvent>({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    session_id: { type: String, required: true },
    event_type: { type: String, required: true },
    action_type: { type: String },
    timestamp: { type: Date, default: Date.now },
    details: { type: Object, required: true },
}, { versionKey: false, timestamps: true });

export const GameEvent = mongoose.model<IGameEvent>("GameEvent", GameEventSchema, "game_events");

//================================================
// 3. Game Badge Schema and Model
//================================================

export interface IGameBadge extends Document {
  badge_id_string: string;
  name: string;
  description: string;
  icon_url: string;
  criteria: object;
}

const GameBadgeSchema: Schema = new Schema<IGameBadge>({
    badge_id_string: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon_url: { type: String, required: true },
    criteria: { type: Object, required: true },
}, { versionKey: false, timestamps: true });

export const GameBadge = mongoose.model<IGameBadge>("GameBadge", GameBadgeSchema, "game_badges");

//================================================
// 4. Game Quest Schema and Model
//================================================

export interface IGameQuest extends Document {
  quest_id_string: string;
  name: string;
  description: string;
  quest_category: "TUTORIAL" | "DAILY" | "MILESTONE" | "EVENT";
  status: "ACTIVE" | "INACTIVE";
  target_personas: string[];
  time_limit?: { start_date: Date; end_date: Date };
  completion_criteria: object;
  rewards: {
    points?: number;
    badge_id?: string;
    virtual_item_id?: string;
  };
}

const GameQuestSchema: Schema = new Schema<IGameQuest>({
    quest_id_string: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    quest_category: { type: String, required: true },
    status: { type: String, required: true, default: 'INACTIVE' },
    target_personas: [{ type: String }],
    time_limit: {
        start_date: { type: Date },
        end_date: { type: Date },
    },
    completion_criteria: { type: Object, required: true },
    rewards: {
        points: { type: Number },
        badge_id: { type: String },
        virtual_item_id: { type: String },
    },
}, { versionKey: false, timestamps: true });

export const GameQuest = mongoose.model<IGameQuest>("GameQuest", GameQuestSchema, "game_quests");

//================================================
// 5. Game Virtual Item Schema and Model
//================================================

export interface IGameVirtualItem extends Document {
  item_id_string: string;
  name: string;
  description?: string;
  item_type: "AVATAR_CLOTHING" | "CAR_PAINT" | "CAR_ACCESSORY" | "CAR_STICKER" | "HOME_DECORATION";
  cost_points: number | null;
  value_points: number;
  rarity: "COMMON" | "RARE" | "EPIC" | "EVENT";
  asset_url: string;
}

const GameVirtualItemSchema: Schema = new Schema<IGameVirtualItem>({
    item_id_string: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    item_type: { type: String, required: true },
    cost_points: { type: Number, default: null },
    value_points: { type: Number, required: true },
    rarity: { type: String, required: true },
    asset_url: { type: String, required: true },
}, { versionKey: false, timestamps: true });

export const GameVirtualItem = mongoose.model<IGameVirtualItem>("GameVirtualItem", GameVirtualItemSchema, "game_virtual_items");
