"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserItemResponse = void 0;
class UserItemResponse {
    constructor(user) {
        var _a, _b, _c;
        this.id = user.id;
        this.email = user.email;
        this.firstName = (_b = (_a = user.firstName) !== null && _a !== void 0 ? _a : user.fullName) !== null && _b !== void 0 ? _b : "Unknown"; // See IUser for details
        this.lastName = (_c = user.lastName) !== null && _c !== void 0 ? _c : "";
        this.mobile = user.mobile;
        this.role = user.role;
        this.createdAt = user.createdAt;
    }
}
exports.UserItemResponse = UserItemResponse;
