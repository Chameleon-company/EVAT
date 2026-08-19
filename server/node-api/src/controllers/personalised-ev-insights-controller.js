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
Object.defineProperty(exports, "__esModule", { value: true });
class PersonalisedEVInsightsController {
    constructor(userService, personalisedEVInsightsService) {
        this.userService = userService;
        this.personalisedEVInsightsService = personalisedEVInsightsService;
    }
    submitInsights(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = req;
            try {
                const existingUser = yield this.userService.getUserById(user === null || user === void 0 ? void 0 : user.id);
                if (!existingUser) {
                    return res.status(404).json({ message: "User not found" });
                }
                const result = yield this.personalisedEVInsightsService.submitInsights((user === null || user === void 0 ? void 0 : user.id) || "", existingUser.email || "", req.body);
                return res.status(201).json(result);
            }
            catch (error) {
                return res.status(400).json({ message: error.message });
            }
        });
    }
    getMyInsights(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = req;
            try {
                const existingUser = yield this.userService.getUserById(user === null || user === void 0 ? void 0 : user.id);
                if (!existingUser) {
                    return res.status(404).json({ message: "User not found" });
                }
                const existingInsight = yield this.personalisedEVInsightsService.getLatestInsightByUserId((user === null || user === void 0 ? void 0 : user.id) || "");
                if (!existingInsight) {
                    return res.status(404).json({
                        message: "No personalised EV insights found for this user",
                    });
                }
                return res.status(200).json({
                    message: "success",
                    data: existingInsight,
                });
            }
            catch (error) {
                return res.status(400).json({ message: error.message });
            }
        });
    }
}
exports.default = PersonalisedEVInsightsController;
