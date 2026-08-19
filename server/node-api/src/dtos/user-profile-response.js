"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileResponse = void 0;
class UserProfileResponse {
    constructor(userId) {
        this.user_id = userId;
        this.avatarURL = "";
        this.user_car_model = null;
        this.favourite_stations = [];
    }
}
exports.UserProfileResponse = UserProfileResponse;
