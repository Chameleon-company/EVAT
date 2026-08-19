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
exports.createRouteFromSentence = exports.createRouteFromPoints = void 0;
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
const axios_1 = __importDefault(require("axios"));
const mapsClient = new google_maps_services_js_1.Client({});
/**
 * Creates a route from the given initial starting location, ending destination, and any along the way stops
 *
 * @param req Request object containing the start, stops and destinations to visit
 * @param res Response object used to send back the HTTP response
 * @returns If error: returns an error message. If successful: returns the route in a JSON format
 */
const createRouteFromPoints = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { start, stops, destination } = req.body;
        if (!start || !destination) {
            return res.status(400).json({ message: "Start and destination are required." });
        }
        const response = yield mapsClient.directions({
            params: {
                origin: start,
                destination: destination,
                waypoints: stops || [],
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
        });
        res.status(200).json({ route: response.data.routes[0] });
    }
    catch (err) {
        console.error(err);
        console.error("Directions API error:", err.message);
        res.status(500).json({ message: "Failed to get route", error: err.message });
    }
});
exports.createRouteFromPoints = createRouteFromPoints;
/**
 * Creates a route from the given text that contains the starting point, ending point and any other destinations to pass by
 *
 * @param req A request object containing a string to be given to Google Gemini to extract a path from
 * @param res Respone object used to send back the HTTP response
 * @returns If error: returns an error message. If successful: returns the route in a JSON format
 */
const createRouteFromSentence = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { sentence } = req.body;
        if (!sentence) {
            return res.status(400).json({ message: "Sentence is required." });
        }
        // Gemini Pro API call using correct model
        const geminiRes = yield axios_1.default.post(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`, {
            contents: [
                {
                    parts: [
                        {
                            text: `Extract the start location, optional stops, and destination from this sentence: "${sentence}". Return only valid JSON like: { "start": "...", "stops": ["..."], "destination": "..." }`
                        }
                    ]
                }
            ]
        }, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        const text = (_c = (_b = (_a = geminiRes.data.candidates[0]) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.parts[0]) === null || _c === void 0 ? void 0 : _c.text;
        if (!text) {
            return res.status(400).json({ message: "Gemini did not return valid output." });
        }
        // Clean up markdown-style response
        const cleanText = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
        let extracted;
        try {
            extracted = JSON.parse(cleanText);
        }
        catch (parseErr) {
            console.error("JSON parse error:", parseErr);
            return res.status(400).json({
                message: "Failed to parse Gemini output as JSON",
                raw: text,
            });
        }
        if (!extracted.start || !extracted.destination) {
            return res.status(400).json({
                message: "Failed to extract start or destination from sentence.",
                extracted,
            });
        }
        // Call Google Maps Directions API
        const directionsRes = yield mapsClient.directions({
            params: {
                origin: extracted.start,
                destination: extracted.destination,
                waypoints: extracted.stops || [],
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
        });
        res.status(200).json({ route: directionsRes.data.routes[0] });
    }
    catch (err) {
        console.error("Gemini error:", err.message);
        res.status(500).json({ message: "Error processing sentence", error: err.message });
    }
});
exports.createRouteFromSentence = createRouteFromSentence;
