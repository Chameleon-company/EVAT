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
class VoiceController {
    constructor(voiceService) {
        this.voiceService = voiceService;
    }
    query(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            try {
                const query = (_a = req.body) === null || _a === void 0 ? void 0 : _a.query;
                if (typeof query !== "string" || query.trim().length < 1) {
                    return res.status(400).json({
                        message: "query is required and must be a non-empty string",
                    });
                }
                const mapCenter = typeof ((_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.map_center) === null || _c === void 0 ? void 0 : _c.lat) === "number" &&
                    typeof ((_e = (_d = req.body) === null || _d === void 0 ? void 0 : _d.map_center) === null || _e === void 0 ? void 0 : _e.lng) === "number"
                    ? { lat: req.body.map_center.lat, lng: req.body.map_center.lng }
                    : undefined;
                const userLocation = typeof ((_g = (_f = req.body) === null || _f === void 0 ? void 0 : _f.user_location) === null || _g === void 0 ? void 0 : _g.lat) === "number" &&
                    typeof ((_j = (_h = req.body) === null || _h === void 0 ? void 0 : _h.user_location) === null || _j === void 0 ? void 0 : _j.lng) === "number"
                    ? { lat: req.body.user_location.lat, lng: req.body.user_location.lng }
                    : undefined;
                const context = mapCenter || userLocation
                    ? { map_center: mapCenter, user_location: userLocation }
                    : undefined;
                const result = yield this.voiceService.processQuery(query, context);
                return res.status(200).json(result);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error occurred";
                return res.status(500).json({ message });
            }
        });
    }
}
exports.default = VoiceController;
