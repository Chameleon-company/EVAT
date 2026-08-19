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
exports.addStation = exports.deleteStation = exports.updateStation = exports.listStations = exports.getInsights = exports.getLogs = exports.updateUser = exports.deleteUser = exports.listUsers = void 0;
const user_model_1 = __importDefault(require("../models/user-model"));
const vehicle_model_1 = __importDefault(require("../models/vehicle-model"));
const station_model_1 = __importDefault(require("../models/station-model"));
/**
 * Handles a request to get all users (Admin only)
 *
 * @param req --Not used in this segment--
 * @param res Response object used to send back the HTTP response containing all users, without including password data
 */
const listUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield user_model_1.default.find({}, '-password');
    res.json(users);
});
exports.listUsers = listUsers;
/**
 * Handles a request to delete a users account
 *
 * @param req Request object containing the User ID
 * @param res Response object used to send back the HTTP response message
 */
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield user_model_1.default.findByIdAndDelete(id);
    res.json({ message: 'User deleted' });
});
exports.deleteUser = deleteUser;
/**
 * Handles a request to update a users information
 *
 * @param req Request object containing the user ID, and the required updates to be done to the user
 * @param res Response object used to send back the updated user data in a JSON format
 */
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updates = req.body;
    const updatedUser = yield user_model_1.default.findByIdAndUpdate(id, updates, { new: true });
    res.json(updatedUser);
});
exports.updateUser = updateUser;
/**
 * Handles a request to get logs
 *
 * @param req --Not used in this segment--
 * @param res Response object containing logs of what user did what and when in a JSON format
 */
const getLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Dummy logs
    res.json([{ action: 'login', user: 'admin', timestamp: new Date() }]);
});
exports.getLogs = getLogs;
/**
 * Handles a request to get insights into the database
 *
 * @param req --Not used in this segment--
 * @param res Response object containing the current number of users and vehicles in the system
 */
const getInsights = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const totalUsers = yield user_model_1.default.countDocuments();
    const totalVehicles = yield vehicle_model_1.default.countDocuments();
    res.json({ totalUsers, totalVehicles });
});
exports.getInsights = getInsights;
/**
 * Handles a request to list all charging stations
 */
const listStations = (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stations = yield station_model_1.default.find();
    res.json(stations);
});
exports.listStations = listStations;
/**
 * Handles a request to update a charging station
 */
const updateStation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updates = req.body;
    const updated = yield station_model_1.default.findByIdAndUpdate(id, updates, { new: true });
    if (!updated)
        return res.status(404).json({ message: 'Station not found' });
    res.json(updated);
});
exports.updateStation = updateStation;
/**
 * Handles a request to delete a charging station
 */
const deleteStation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const deleted = yield station_model_1.default.findByIdAndDelete(id);
    if (!deleted)
        return res.status(404).json({ message: 'Station not found' });
    res.json({ message: 'Station deleted' });
});
exports.deleteStation = deleteStation;
/**
 * Handles a request to add a new charging station
 */
const addStation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const station = yield station_model_1.default.create(req.body);
        res.status(201).json({ message: "Charging station added", data: station });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.addStation = addStation;
