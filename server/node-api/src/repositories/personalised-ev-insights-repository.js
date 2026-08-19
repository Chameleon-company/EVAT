"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const personalisedEVInsightsModel_1 = __importDefault(require("../models/personalisedEVInsightsModel"));
class PersonalisedEVInsightsRepository {
    static createInsight(userId, email, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const insight = yield personalisedEVInsightsModel_1.default.create(Object.assign(Object.assign({ userId,
                    email }, payload), { cluster: null }));
                return insight;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error saving personalised EV insight: " + error.message);
                }
                throw new Error("An unknown error occurred while saving personalised EV insight");
            }
        });
    }
    static updateInsightWithResult(insightId, result) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield personalisedEVInsightsModel_1.default.findByIdAndUpdate(insightId, {
                    $set: {
                        cluster: result.cluster,
                        profileType: result.profileType,
                        description: result.description,
                        estimatedSavings: result.estimatedSavings,
                        savingsMessage: result.savingsMessage,
                        similarDriverAverages: result.similarDriverAverages,
                        allDriverAverages: result.allDriverAverages,
                        comparison: result.comparison,
                    },
                }, { new: true }).exec();
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error updating personalised EV insight result: " + error.message);
                }
                throw new Error("An unknown error occurred while updating personalised EV insight result");
            }
        });
    }
    static getLatestInsightByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const insight = yield personalisedEVInsightsModel_1.default.findOne({ userId })
                    .sort({ createdAt: -1 })
                    .exec();
                return insight;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error("Error retrieving personalised EV insight: " + error.message);
                }
                throw new Error("An unknown error occurred while retrieving personalised EV insight");
            }
        });
    }
}
exports.default = PersonalisedEVInsightsRepository;
