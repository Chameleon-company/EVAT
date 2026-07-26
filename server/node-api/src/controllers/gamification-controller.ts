import { Request, Response } from "express";
import { GameProfile, GameVirtualItem, GameEvent, GameBadge, GameQuest } from "../models/game-model";
import mongoose from "mongoose";

// A map to define points for each action type, used by the logAction function
const actionPoints: { [key: string]: number } = {
    app_login: 10,
    check_in: 10,
    upload_photo: 15,
    fun_quiz_correct: 20,
    ask_chatbot_question: 20,
    use_route_planner: 25,
    report_fault: 25,
    validate_ai_prediction: 75,
    redeem_easter_egg: 100,
    complete_long_trip_with_planner: 150,
    charge_at_green_station: 250,
    discover_new_station_in_black_spot: 1000,
};

export default class GamificationController {

    //================================================
    // User Profile & Leaderboard
    //================================================

    /**
     * Retrieves the complete gamification profile for the authenticated user.
     */
    async getGameProfileForUser(req: Request, res: Response): Promise<Response> {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated." });
        }

        try {
            const userProfile = await GameProfile.findOne({ main_app_user_id: userId })
                .populate('inventory.badges_earned')
                .populate('inventory.virtual_items')
                .exec();

            if (!userProfile) {
                const defaultProfile = {
                    main_app_user_id: userId,
                    gamification_profile: { persona: "ANXIOUS_NEWCOMER", points_balance: 0, net_worth: 0 },
                    engagement_metrics: { current_app_login_streak: 0, longest_app_login_streak: 0, last_login_date: null },
                    contribution_summary: { total_check_ins: 0, total_fault_reports: 0, total_ai_validations: 0, total_black_spot_discoveries: 0, total_route_plans: 0, total_chatbot_questions: 0, total_quizzes_correct: 0, total_easter_eggs_redeemed: 0, total_virtual_items_purchased: 0, },
                    inventory: { badges_earned: [], virtual_items: [] },
                    active_quests: []
                };
                 return res.status(200).json({ message: "User profile retrieved successfully", data: defaultProfile });
            }

            return res.status(200).json({ message: "User profile retrieved successfully", data: userProfile });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error fetching user profile", error: error.message });
        }
    }

    /**
     * Retrieves the public leaderboard, sorted by net worth.
     */
    async getLeaderboard(req: Request, res: Response): Promise<Response> {
        try {
            const topUsers = await GameProfile.find()
                .sort({ 'gamification_profile.net_worth': -1 })
                .limit(100)
                .select('main_app_user_id gamification_profile.persona gamification_profile.net_worth')
                .exec();

            return res.status(200).json({ message: "Leaderboard retrieved successfully", data: topUsers });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error fetching leaderboard", error: error.message });
        }
    }


    //================================================
    // Core Gamification Logic
    //================================================

    /**
     * Retrieves all purchasable virtual items for the shop.
     */
    async getVirtualItems(req: Request, res: Response): Promise<Response> {
        try {
            const items = await GameVirtualItem.find({ cost_points: { $ne: null } }).exec();
            return res.status(200).json({
                message: "Virtual items retrieved successfully",
                data: items,
            });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error while fetching virtual items", error: error.message });
        }
    }

    /**
     * Handles a user's request to purchase a virtual item with points.
     */
    async purchaseVirtualItem(req: Request, res: Response): Promise<Response> {
        const { itemId, session_id } = req.body;
        const userId = req.user?.id;

        if (!itemId) return res.status(400).json({ message: "Item ID is required." });
        if (!userId) return res.status(401).json({ message: "User not authenticated." });

        try {
            const item = await GameVirtualItem.findOne({ item_id_string: itemId }).exec();
            let userProfile = await GameProfile.findOne({ main_app_user_id: userId }).exec();

            if (!item) return res.status(404).json({ message: `Item with ID '${itemId}' not found.` });
            if (!userProfile) userProfile = new GameProfile({ main_app_user_id: userId });
            if (item.cost_points === null) return res.status(400).json({ message: "This item cannot be purchased." });
            if (userProfile.inventory.virtual_items.includes(item._id)) return res.status(400).json({ message: "You already own this item." });
            if (userProfile.gamification_profile.points_balance < item.cost_points) return res.status(400).json({ message: "Insufficient points." });

            userProfile.gamification_profile.points_balance -= item.cost_points;
            userProfile.gamification_profile.net_worth += (item.value_points - item.cost_points);
            userProfile.inventory.virtual_items.push(item._id);
            userProfile.contribution_summary.total_virtual_items_purchased = (userProfile.contribution_summary.total_virtual_items_purchased || 0) + 1;

            const eventLog = new GameEvent({
                user_id: new mongoose.Types.ObjectId(userId),
                session_id: session_id,
                event_type: 'POINTS_TRANSACTION',
                action_type: 'purchase_virtual_item',
                details: {
                    points_change: -item.cost_points,
                    reason: "ITEM_PURCHASE",
                    item_id_string: item.item_id_string,
                }
            });

            await userProfile.save();
            await eventLog.save();

            return res.status(200).json({
                message: `Successfully purchased '${item.name}'!`,
                data: {
                    new_balance: userProfile.gamification_profile.points_balance,
                    updated_profile: userProfile
                }
            });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error during item purchase.", error: error.message });
        }
    }

    /**
     * Logs a user action, updates profile stats, grants points, and checks for quest/badge completion.
     */
    async logAction(req: Request, res: Response): Promise<Response> {
        const { action_type, details = {}, session_id } = req.body;
        const userId = req.user?.id;

        if (!action_type) return res.status(400).json({ message: "Action type is required." });
        if (!userId) return res.status(401).json({ message: "User not authenticated." });

        try {
            let userProfile = await GameProfile.findOne({ main_app_user_id: userId }).exec();
            if (!userProfile) {
                userProfile = new GameProfile({ main_app_user_id: userId });
            }

            const pointsToAdd = actionPoints[action_type] || 0;
            if (pointsToAdd > 0) {
                userProfile.gamification_profile.points_balance += pointsToAdd;
                userProfile.gamification_profile.net_worth += pointsToAdd;
            }

            const summaryKey = `total_${action_type}s`;
            if (userProfile.contribution_summary && summaryKey in userProfile.contribution_summary) {
                (userProfile.contribution_summary as any)[summaryKey]++;
            }

            if (action_type === 'app_login') {
                const today = new Date();
                const lastLogin = userProfile.engagement_metrics.last_login_date;

                // --- TEMPORARY BACKDOOR FOR FRONTEND TESTING ---
                // This logic increments the streak on EVERY call, regardless of the day.
                if (lastLogin) {
                    userProfile.engagement_metrics.current_app_login_streak++;
                } else {
                    userProfile.engagement_metrics.current_app_login_streak = 1;
                }
                // --- END OF TEMPORARY BACKDOOR ---


                /* --- ORIGINAL LOGIC TO RESTORE LATER ---
                if (lastLogin) {
                    const yesterday = new Date();
                    yesterday.setDate(today.getDate() - 1);
                    if (lastLogin.toDateString() === yesterday.toDateString()) {
                        userProfile.engagement_metrics.current_app_login_streak++;
                    } else if (lastLogin.toDateString() !== today.toDateString()) {
                        userProfile.engagement_metrics.current_app_login_streak = 1;
                    }
                } else {
                    userProfile.engagement_metrics.current_app_login_streak = 1;
                }
                */
                
                if (userProfile.engagement_metrics.current_app_login_streak > userProfile.engagement_metrics.longest_app_login_streak) {
                    userProfile.engagement_metrics.longest_app_login_streak = userProfile.engagement_metrics.current_app_login_streak;
                }
                userProfile.engagement_metrics.last_login_date = today;
            }

            const eventLog = new GameEvent({
                user_id: new mongoose.Types.ObjectId(userId),
                session_id: session_id,
                event_type: 'ACTION_PERFORMED',
                action_type,
                details: details
            });
            
            await userProfile.save();
            await eventLog.save();

            // TODO: Add logic to check and award quests/badges after profile update

            return res.status(200).json({ message: "Action logged successfully", data: { new_balance: userProfile.gamification_profile.points_balance, updated_profile: userProfile } });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error logging action.", error: error.message });
        }
    }



    //================================================
    // Management Functions
    //================================================

    // --- Game Event Management (for testing) ---
    async createEvent(req: Request, res: Response): Promise<Response> {
        try {
            const newEvent = new GameEvent(req.body);
            await newEvent.save();
            return res.status(201).json({ message: "Event created successfully (for testing)", data: newEvent });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error creating event", error: error.message });
        }
    }

    async getAllEvents(req: Request, res: Response): Promise<Response> {
        try {
            const events = await GameEvent.find().sort({ timestamp: -1 }).limit(200).exec();
            return res.status(200).json({ message: "All events retrieved", data: events });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error retrieving events", error: error.message });
        }
    }

    async getEventsByUserId(req: Request, res: Response): Promise<Response> {
        try {
            const events = await GameEvent.find({ user_id: req.params.userId }).sort({ timestamp: -1 }).exec();
            if (!events || events.length === 0) {
                return res.status(404).json({ message: "No events found for this user ID" });
            }
            return res.status(200).json({ message: "User events retrieved", data: events });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error retrieving user events", error: error.message });
        }
    }
    
    async deleteEvent(req: Request, res: Response): Promise<Response> {
        try {
            const deletedEvent = await GameEvent.findByIdAndDelete(req.params.eventId).exec();
            if (!deletedEvent) {
                return res.status(404).json({ message: "Event not found" });
            }
            return res.status(200).json({ message: "Event deleted successfully (for testing)" });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error deleting event", error: error.message });
        }
    }

    // --- Game Profile Management ---
    async createGameProfile(req: Request, res: Response): Promise<Response> {
        try {
            const { main_app_user_id } = req.body;
            if (!main_app_user_id) {
                return res.status(400).json({ message: "main_app_user_id is required." });
            }
            const existingProfile = await GameProfile.findOne({ main_app_user_id }).exec();
            if (existingProfile) {
                return res.status(400).json({ message: "A game profile for this user already exists." });
            }
            const newProfile = new GameProfile(req.body);
            await newProfile.save();
            return res.status(201).json({ message: "Game profile created successfully", data: newProfile });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error creating game profile", error: error.message });
        }
    }

    async getAllGameProfiles(req: Request, res: Response): Promise<Response> {
        try {
            const profiles = await GameProfile.find().exec();
            return res.status(200).json({ message: "All game profiles retrieved", data: profiles });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error retrieving game profiles", error: error.message });
        }
    }

    async getGameProfileByUserId(req: Request, res: Response): Promise<Response> {
        try {
            const profile = await GameProfile.findOne({ main_app_user_id: req.params.userId }).exec();
            if (!profile) {
                return res.status(404).json({ message: "Game profile not found for this user ID" });
            }
            return res.status(200).json({ message: "Game profile retrieved", data: profile });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error retrieving game profile", error: error.message });
        }
    }

    async updateGameProfile(req: Request, res: Response): Promise<Response> {
        try {
            const updatedProfile = await GameProfile.findOneAndUpdate({ main_app_user_id: req.params.userId }, req.body, { new: true }).exec();
            if (!updatedProfile) {
                return res.status(404).json({ message: "Game profile not found for this user ID" });
            }
            return res.status(200).json({ message: "Game profile updated successfully", data: updatedProfile });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error updating game profile", error: error.message });
        }
    }

    async deleteGameProfile(req: Request, res: Response): Promise<Response> {
        try {
            const deletedProfile = await GameProfile.findOneAndDelete({ main_app_user_id: req.params.userId }).exec();
            if (!deletedProfile) {
                return res.status(404).json({ message: "Game profile not found for this user ID" });
            }
            return res.status(200).json({ message: "Game profile deleted successfully" });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error deleting game profile", error: error.message });
        }
    }


    // --- Virtual Item Management ---

    async createVirtualItem(req: Request, res: Response): Promise<Response> {
        try {
            const newItem = new GameVirtualItem(req.body);
            await newItem.save();
            return res.status(201).json({ message: "Virtual item created successfully", data: newItem });
        } catch (error: any) {
            return res.status(500).json({ message: "Error creating virtual item", error: error.message });
        }
    }

    async getAllVirtualItems(req: Request, res: Response): Promise<Response> {
        try {
            const items = await GameVirtualItem.find().exec();
            return res.status(200).json({ message: "All virtual items retrieved", data: items });
        } catch (error: any) {
            return res.status(500).json({ message: "Error retrieving virtual items", error: error.message });
        }
    }

    async getVirtualItemById(req: Request, res: Response): Promise<Response> {
        try {
            const { itemId } = req.params;
            const item = await GameVirtualItem.findById(itemId).exec();
            if (!item) {
                return res.status(404).json({ message: "Virtual item not found" });
            }
            return res.status(200).json({ message: "Virtual item retrieved", data: item });
        } catch (error: any) {
            return res.status(500).json({ message: "Error retrieving virtual item", error: error.message });
        }
    }

    async updateVirtualItem(req: Request, res: Response): Promise<Response> {
        try {
            const { itemId } = req.params;
            const updatedItem = await GameVirtualItem.findByIdAndUpdate(itemId, req.body, { new: true }).exec();
            if (!updatedItem) {
                return res.status(404).json({ message: "Virtual item not found" });
            }
            return res.status(200).json({ message: "Virtual item updated successfully", data: updatedItem });
        } catch (error: any) {
            return res.status(500).json({ message: "Error updating virtual item", error: error.message });
        }
    }

    async deleteVirtualItem(req: Request, res: Response): Promise<Response> {
        try {
            const { itemId } = req.params;
            const deletedItem = await GameVirtualItem.findByIdAndDelete(itemId).exec();
            if (!deletedItem) {
                return res.status(404).json({ message: "Virtual item not found" });
            }
            return res.status(200).json({ message: "Virtual item deleted successfully" });
        } catch (error: any) {
            return res.status(500).json({ message: "Error deleting virtual item", error: error.message });
        }
    }

    // --- Badge Management ---

    async createBadge(req: Request, res: Response): Promise<Response> {
        try {
            const newBadge = new GameBadge(req.body);
            await newBadge.save();
            return res.status(201).json({ message: "Badge created successfully", data: newBadge });
        } catch (error: any) {
            return res.status(500).json({ message: "Error creating badge", error: error.message });
        }
    }

    async getAllBadges(req: Request, res: Response): Promise<Response> {
        try {
            const badges = await GameBadge.find().exec();
            return res.status(200).json({ message: "All badges retrieved", data: badges });
        } catch (error: any) {
            return res.status(500).json({ message: "Error retrieving badges", error: error.message });
        }
    }

    async getBadgeById(req: Request, res: Response): Promise<Response> {
        try {
            const { badgeId } = req.params;
            const badge = await GameBadge.findById(badgeId).exec();
            if (!badge) {
                return res.status(404).json({ message: "Badge not found" });
            }
            return res.status(200).json({ message: "Badge retrieved", data: badge });
        } catch (error: any) {
            return res.status(500).json({ message: "Error retrieving badge", error: error.message });
        }
    }

    async updateBadge(req: Request, res: Response): Promise<Response> {
        try {
            const { badgeId } = req.params;
            const updatedBadge = await GameBadge.findByIdAndUpdate(badgeId, req.body, { new: true }).exec();
            if (!updatedBadge) {
                return res.status(404).json({ message: "Badge not found" });
            }
            return res.status(200).json({ message: "Badge updated successfully", data: updatedBadge });
        } catch (error: any) {
            return res.status(500).json({ message: "Error updating badge", error: error.message });
        }
    }

    async deleteBadge(req: Request, res: Response): Promise<Response> {
        try {
            const { badgeId } = req.params;
            const deletedBadge = await GameBadge.findByIdAndDelete(badgeId).exec();
            if (!deletedBadge) {
                return res.status(404).json({ message: "Badge not found" });
            }
            return res.status(200).json({ message: "Badge deleted successfully" });
        } catch (error: any) {
            return res.status(500).json({ message: "Error deleting badge", error: error.message });
        }
    }

    // --- Quest Management ---

    async createQuest(req: Request, res: Response): Promise<Response> {
        try {
            const newQuest = new GameQuest(req.body);
            await newQuest.save();
            return res.status(201).json({ message: "Quest created successfully", data: newQuest });
        } catch (error: any) {
            return res.status(500).json({ message: "Error creating quest", error: error.message });
        }
    }

    async getAllQuests(req: Request, res: Response): Promise<Response> {
        try {
            const quests = await GameQuest.find().exec();
            return res.status(200).json({ message: "All quests retrieved", data: quests });
        } catch (error: any) {
            return res.status(500).json({ message: "Error retrieving quests", error: error.message });
        }
    }

    async getQuestById(req: Request, res: Response): Promise<Response> {
        try {
            const { questId } = req.params;
            const quest = await GameQuest.findById(questId).exec();
            if (!quest) {
                return res.status(404).json({ message: "Quest not found" });
            }
            return res.status(200).json({ message: "Quest retrieved", data: quest });
        } catch (error: any) {
            return res.status(500).json({ message: "Error retrieving quest", error: error.message });
        }
    }

    async updateQuest(req: Request, res: Response): Promise<Response> {
        try {
            const { questId } = req.params;
            const updatedQuest = await GameQuest.findByIdAndUpdate(questId, req.body, { new: true }).exec();
            if (!updatedQuest) {
                return res.status(404).json({ message: "Quest not found" });
            }
            return res.status(200).json({ message: "Quest updated successfully", data: updatedQuest });
        } catch (error: any) {
            return res.status(500).json({ message: "Error updating quest", error: error.message });
        }
    }

    async deleteQuest(req: Request, res: Response): Promise<Response> {
        try {
            const { questId } = req.params;
            const deletedQuest = await GameQuest.findByIdAndDelete(questId).exec();
            if (!deletedQuest) {
                return res.status(404).json({ message: "Quest not found" });
            }
            return res.status(200).json({ message: "Quest deleted successfully" });
        } catch (error: any) {
            return res.status(500).json({ message: "Error deleting quest", error: error.message });
        }
    }
}