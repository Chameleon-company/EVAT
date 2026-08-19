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
exports.authGuard = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_repository_1 = __importDefault(require("../repositories/user-repository"));
const authGuard = (allowedRoles) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ message: "No token provided" });
            }
            const token = authHeader.split(" ")[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // ✅ Admin token path
            if (decoded.admin) {
                if (!allowedRoles.includes('admin')) {
                    return res.status(403).json({ message: "Admin not authorized for this route" });
                }
                req.user = {
                    id: 'admin',
                    email: decoded.email || 'admin@evat.com',
                    role: 'admin'
                };
                return next();
            }
            // ✅ Regular user path
            if (!decoded.id) {
                return res.status(401).json({ message: "Invalid token: missing user ID" });
            }
            const user = yield user_repository_1.default.findById(decoded.id);
            if (!user) {
                return res.status(401).json({ message: "User no longer exists" });
            }
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: "Not authorized to access this route" });
            }
            req.user = user;
            next();
        }
        catch (error) {
            return res.status(401).json({ message: "Invalid token" });
        }
    });
};
exports.authGuard = authGuard;
