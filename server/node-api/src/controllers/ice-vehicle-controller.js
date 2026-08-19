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
class ProfileController {
    constructor(iceVehicleService) {
        this.iceVehicleService = iceVehicleService;
    }
    /**
     * Handles a request to retrieve a vehicle by its ID
     *
     * @param req Request object containing the vehicle ID
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getVehicleById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { vehicleId } = req.params;
            try {
                const existingVehicle = yield this.iceVehicleService.getVehicleById(vehicleId);
                return res.status(201).json({
                    message: "success",
                    data: existingVehicle,
                });
            }
            catch (error) {
                return res.status(400).json({ message: error.message });
            }
        });
    }
    /**
     * Handles a request to retrieve all vehicles
     *
     * @param req --Not used in this segment--
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code, a relevant message, and the data if the request was successful
     */
    getAllVehicles(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingVehicles = yield this.iceVehicleService.getAllVehicles();
                return res.status(201).json({
                    message: "success",
                    data: existingVehicles,
                });
            }
            catch (error) {
                return res.status(400).json({ message: error.message });
            }
        });
    }
}
exports.default = ProfileController;
