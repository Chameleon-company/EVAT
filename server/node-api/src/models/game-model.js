"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameVirtualItem = exports.GameQuest = exports.GameBadge = exports.GameEvent = exports.GameProfile = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const GameProfileSchema = new mongoose_1.Schema({
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
        badges_earned: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'GameBadge' }],
        virtual_items: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'GameVirtualItem' }],
    },
    active_quests: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'GameQuest' }],
}, { versionKey: false, timestamps: true });
exports.GameProfile = mongoose_1.default.model("GameProfile", GameProfileSchema, "game_profiles");
const GameEventSchema = new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    session_id: { type: String, required: true },
    event_type: { type: String, required: true },
    action_type: { type: String },
    timestamp: { type: Date, default: Date.now },
    details: { type: Object, required: true },
}, { versionKey: false, timestamps: true });
exports.GameEvent = mongoose_1.default.model("GameEvent", GameEventSchema, "game_events");
const GameBadgeSchema = new mongoose_1.Schema({
    badge_id_string: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon_url: { type: String, required: true },
    criteria: { type: Object, required: true },
}, { versionKey: false, timestamps: true });
exports.GameBadge = mongoose_1.default.model("GameBadge", GameBadgeSchema, "game_badges");
const GameQuestSchema = new mongoose_1.Schema({
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
exports.GameQuest = mongoose_1.default.model("GameQuest", GameQuestSchema, "game_quests");
const GameVirtualItemSchema = new mongoose_1.Schema({
    item_id_string: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    item_type: { type: String, required: true },
    cost_points: { type: Number, default: null },
    value_points: { type: Number, required: true },
    rarity: { type: String, required: true },
    asset_url: { type: String, required: true },
}, { versionKey: false, timestamps: true });
exports.GameVirtualItem = mongoose_1.default.model("GameVirtualItem", GameVirtualItemSchema, "game_virtual_items");
