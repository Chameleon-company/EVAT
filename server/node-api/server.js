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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./src/config/env");
const database_config_1 = __importDefault(require("./src/config/database-config"));
const error_middleware_1 = require("./src/middlewares/error-middleware");
// Routes
const charger_1 = __importDefault(require("./src/routes/charger"));
const navigation_route_1 = __importDefault(require("./src/routes/navigation-route"));
const charger_session_route_1 = __importDefault(require("./src/routes/charger-session-route"));
const feedback_route_1 = __importDefault(require("./src/routes/feedback-route"));
const charger_review_route_1 = __importDefault(require("./src/routes/charger-review-route"));
const booking_route_1 = __importDefault(require("./src/routes/booking-route"));
const gamification_route_1 = __importDefault(require("./src/routes/gamification-route"));
const support_request_route_1 = __importDefault(require("./src/routes/support-request-route"));
const user_route_1 = __importDefault(require("./src/routes/user-route"));
const profile_route_1 = __importDefault(require("./src/routes/profile-route"));
const vehicle_route_1 = __importDefault(require("./src/routes/vehicle-route"));
const ice_vehicle_route_1 = __importDefault(require("./src/routes/ice-vehicle-route"));
const station_route_1 = __importDefault(require("./src/routes/station-route"));
const charger_recommendation_route_1 = __importDefault(require("./src/routes/charger-recommendation-route"));
const admin_auth_route_1 = __importDefault(require("./src/routes/admin-auth-route"));
const admin_route_1 = __importDefault(require("./src/routes/admin-route"));
const predict_route_1 = __importDefault(require("./src/routes/predict-route"));
const price_prediction_route_1 = __importDefault(require("./src/routes/price-prediction-route"));
const reliability_scoring_route_1 = __importDefault(require("./src/routes/reliability-scoring-route"));
const env_impact_analysis_route_1 = __importDefault(require("./src/routes/env-impact-analysis-route"));
const voice_route_1 = __importDefault(require("./src/routes/voice-route"));
const user_stats_route_1 = __importDefault(require("./src/routes/user-stats-route"));
const achievement_route_1 = __importDefault(require("./src/routes/achievement-route"));
const personalised_ev_insights_routes_1 = __importDefault(require("./src/routes/personalised-ev-insights-routes"));
const weather_aware_routing_routes_1 = __importDefault(require("./src/routes/weather-aware-routing-routes"));
const app = (0, express_1.default)();
const PORT = env_1.env.PORT;
const DOMAIN_URL = env_1.env.DOMAIN_URL;
// Mongoose deprecation warning for 'strictQuery'
mongoose_1.default.set('strictQuery', true);
const admin_1 = __importDefault(require("./src/models/admin"));
const createDefaultAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    const existingAdmin = yield admin_1.default.findOne({});
    if (!existingAdmin) {
        yield admin_1.default.create({ username: 'admin', password: 'admin' });
        console.log('✅ Default admin created');
    }
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Swagger definition
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "EVAT API",
            version: "1.0.0",
            description: "API documentation for EVAT App",
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    in: "header",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        // PUBLIC_API_URL wins when set (Docker publishes the API on a different
        // host port than the one the process listens on).
        servers: [{ url: (_a = process.env.PUBLIC_API_URL) !== null && _a !== void 0 ? _a : `${DOMAIN_URL}:${PORT}` }],
    },
    apis: ["./src/routes/*.ts", "./src/routes/*.js"],
};
// Initialize swagger-jsdoc
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
// Serve Swagger UI
app.use("/api/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec, { explorer: true }));
app.get("/api-docs/json", (req, res) => {
    res.json(swaggerSpec);
});
// User Route
app.use("/api/auth", user_route_1.default);
app.use("/api/profile", profile_route_1.default);
app.use("/api/vehicle", vehicle_route_1.default);
app.use("/api/ice-vehicle", ice_vehicle_route_1.default);
app.use('/api/admin', admin_route_1.default);
app.use('/api/admin-auth', admin_auth_route_1.default);
app.use('/api/chargers', station_route_1.default); // As laid out in teams https://teams.microsoft.com/l/message/19:7206bda1ca594fa2a18709af5d9fb718@thread.v2/1743116771178?context=%7B%22contextType%22%3A%22chat%22%7D
app.use('/api/charger-recommendations', charger_recommendation_route_1.default);
app.use("/api/navigation", navigation_route_1.default);
app.use("/api/altChargers", charger_1.default);
app.use("/api/charger-sessions", charger_session_route_1.default);
app.use("/api/feedback", feedback_route_1.default);
app.use("/api/charger-reviews", charger_review_route_1.default);
app.use("/api/bookings", booking_route_1.default);
app.use("/api/gamification", gamification_route_1.default);
app.use("/api/support-requests", support_request_route_1.default);
app.use("/api/predict", predict_route_1.default);
app.use("/api/predict", price_prediction_route_1.default);
app.use("/api/reliability", reliability_scoring_route_1.default);
app.use("/api/env-impact-analysis", env_impact_analysis_route_1.default);
app.use("/api/voice", voice_route_1.default);
app.use("/api/user-stats", user_stats_route_1.default);
app.use("/api/achievements", achievement_route_1.default);
app.use("/api/personalised-ev-insights", personalised_ev_insights_routes_1.default);
app.use("/api/weather-aware-routing", weather_aware_routing_routes_1.default);
// Serve React frontend
const buildPath = path_1.default.join(__dirname, "/build");
app.use(express_1.default.static(buildPath));
// Catch-all to serve index.html for any route (for React Router)
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(buildPath, "index.html"));
});
// Middleware
app.use(error_middleware_1.notFound);
app.use(error_middleware_1.errorHandler);
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, database_config_1.default)();
        yield createDefaultAdmin();
        app.listen(PORT, () => {
            console.log(`Server is running on ${DOMAIN_URL}:${PORT}`);
            console.log(`Swagger UI is available on ${DOMAIN_URL}:${PORT}/api/docs`);
        });
    }
    catch (error) {
        console.error("Server startup error:", error);
        process.exit(1);
    }
});
startServer();
