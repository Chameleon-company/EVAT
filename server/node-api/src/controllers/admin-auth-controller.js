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
exports.updateAdminCredentials = exports.verifyAdmin2FA = exports.adminLogin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const admin_1 = __importDefault(require("../models/admin"));
const env_1 = require("../config/env");
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: env_1.env.EMAIL_USER,
        pass: env_1.env.EMAIL_PASS
    }
});
/**
 * Handles an admin login request
 *
 * @param req Request object containing an email and a password
 * @param res Response object used to send back the HTTP response
 * @returns If error: Return an error message. If successful: return a login token with an expiry of 1 day
 */
const adminLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const admin = yield admin_1.default.findOne({ username });
        if (!admin || admin.password !== password) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 5 * 60 * 1000);
        admin.twoFactorCode = code;
        admin.twoFactorCodeExpiry = expiry;
        yield admin.save();
        yield transporter.sendMail({
            from: `"EVAT Admin" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL, // Don't hardcode emails!
            subject: 'Your EVAT Admin 2FA Code',
            text: `Your verification code is: ${code}`,
            html: `<h3>Your EVAT Admin Login Code:</h3><p><b>${code}</b></p>`
        });
        return res.status(200).json({ message: 'Verification code sent to admin email' });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
exports.adminLogin = adminLogin;
const verifyAdmin2FA = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, code } = req.body;
        const admin = yield admin_1.default.findOne({ username });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        const now = new Date();
        if (!admin.twoFactorCode ||
            admin.twoFactorCode !== code ||
            admin.twoFactorCodeExpiry < now) {
            return res.status(403).json({ message: 'Invalid or expired verification code' });
        }
        admin.twoFactorCode = '';
        admin.twoFactorCodeExpiry = new Date(0);
        yield admin.save();
        const token = jsonwebtoken_1.default.sign({ admin: true }, process.env.JWT_SECRET, {
            expiresIn: '1d'
        });
        return res.status(200).json({ token });
    }
    catch (error) {
        console.error('2FA verification error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
exports.verifyAdmin2FA = verifyAdmin2FA;
/**
 * Handles a request to update the credentials of an admin account
 *
 * @param req Request object containing a new email and password, and the admin user to update
 * @param res Response object used to send back the HTTP response
 * @returns If error: Return an error message. If successful: update the credentials of the admin account
 */
const updateAdminCredentials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const admin = yield admin_1.default.findOne({});
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        admin.username = username || admin.username;
        admin.password = password || admin.password;
        yield admin.save();
        return res.status(200).json({ message: 'Admin credentials updated' });
    }
    catch (error) {
        console.error('Credential update error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
exports.updateAdminCredentials = updateAdminCredentials;
