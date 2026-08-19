"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackResponse = void 0;
class FeedbackResponse {
    constructor(feedback) {
        this.id = feedback._id.toString();
        this.name = feedback.name;
        this.email = feedback.email;
        this.suggestion = feedback.suggestion;
        this.status = feedback.status;
        this.createdAt = feedback.createdAt;
        this.updatedAt = feedback.updatedAt;
    }
}
exports.FeedbackResponse = FeedbackResponse;
