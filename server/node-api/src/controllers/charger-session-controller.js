"use strict";
// Process HTTP requests/responses related to charging sessions
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
// ChargerSessionController Class
class ChargerSessionController {
    constructor(sessionService, userStatsService) {
        this.sessionService = sessionService;
        this.userStatsService = userStatsService;
        /**
         * SSE Endpoint to live stream the session events
         * @param req Request object (can carry authentication info like admin)
         * @param res Response object kept open for continuous stream
         */
        this.streamSessions = (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            this.sessionService.streamSessions((event) => {
                res.write(`data: ${JSON.stringify(event)}\n\n`);
            });
        };
        /**
         * REST Endpoint for historical logs
         * @param req Request object containing optional query params like limit and skip
         * @param res Response object that sends back JSON list of logs
         */
        this.getLogs = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { limit = 100, skip = 0 } = req.query;
                const logs = yield this.sessionService.getLogs({}, Number(limit), Number(skip));
                res.json(logs);
            }
            catch (err) {
                res.status(500).json({ error: 'Failed to fetch logs' });
            }
        });
    }
    // /**
    //  * Handle the request to get all charging sessions with optional filtering
    //  * 
    //  * @param req request object containing optional query parameters for filtering
    //  * @param res Response object used to send back the HTTP response
    //  */
    // async getAllSessions(req: Request, res: Response): Promise<Response> {
    //   // Process filtering query parameters (e.g., userId, stationId, startTime, endTime)
    //   let { userId, stationId, status, startTime, endTime } = req.query;
    //   // Validate query parameters and convert if needed...
    //   let filters = {
    //     userId: userId ? String(userId) : undefined,
    //     stationId: stationId ? String(stationId) : undefined,
    //     status: status ? String(status) : undefined,
    //     startTime: startTime ? new Date(startTime as string) : undefined,
    //     endTime: endTime ? new Date(endTime as string) : undefined,
    //   };
    //   try {
    //     const sessions = await this.sessionService.getAllSessions(filters);
    //     return res.status(200).json({
    //       message: "Sessions retrieved successfully!",
    //       data: sessions,
    //     });
    //   } catch (error: any) {
    //     return res.status(500).json({ message: error.message });
    //   }
    // }
    /**
     * Start a new charging session
     *
     * @param req Request object containing the session details
     * @param res Response object used to send back the HTTP response
     */
    createSession(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, stationId, startTime } = req.body;
                const session = yield this.sessionService.createSession({
                    userId,
                    stationId,
                    startTime,
                });
                return res.status(201).json({
                    message: `Charging session ID ${session._id} started.`,
                    data: session,
                });
            }
            catch (error) {
                return this.handleError(error, res);
            }
        });
    }
    /**
     * End a charging session by session ID
     *
     * @param req Request object containing the session ID
     * @param res Response object used to send back the HTTP response
     */
    endSession(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sessionId } = req.params;
                const session = yield this.sessionService.endSession(sessionId);
                // Update User stats and Achievements
                let newAchievements = [];
                if ((session === null || session === void 0 ? void 0 : session.userId) && session.endTime && session.startTime) {
                    const durationSeconds = Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000);
                    const statsResult = yield this.userStatsService.recordChargingSession(session.userId.toString(), {
                        chargeTimeSeconds: (durationSeconds || 0) * 1000, // convert to Wh
                        whCharged: session.energyDelivered || 0,
                        // Not available in model yet
                        // This can be calculated if there is a profile vehicle assigned and the average Wh/km is known.
                        metresTravelled: 0,
                        chargingCostCents: (session.cost || 0) * 100, // convert to cents
                    });
                    newAchievements = statsResult.newAchievements;
                }
                return res.status(200).json({
                    message: `Charging session ID ${session._id} ended.`,
                    data: {
                        session,
                        newAchievements // for front end to use for unlocked achievements
                    },
                });
            }
            catch (error) {
                return this.handleError(error, res);
            }
        });
    }
    /**
     * Get a charging session by session ID
     *
     * @param req Request object containing the session ID
     * @param res Response object used to send back the HTTP response
     */
    getSessionById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sessionId } = req.params;
                const session = yield this.sessionService.getSessionById(sessionId);
                return res.status(200).json({
                    message: `Success! Session ID ${sessionId} found.`,
                    data: session,
                });
            }
            catch (error) {
                return this.handleError(error, res);
            }
        });
    }
    /**
     * Get all sessions for a specific user ID
     *
     * @param req Request object containing the user ID
     * @param res Response object used to send back the HTTP response
     */
    getSessionsByUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const sessions = yield this.sessionService.getSessionsByUser(userId);
                return res.status(200).json({
                    message: `User ID ${userId} sessions found.`,
                    data: sessions,
                });
            }
            catch (error) {
                return this.handleError(error, res);
            }
        });
    }
    /**
     * Get all sessions for a specific station ID
     *
     * @param req Request object containing the station ID
     * @param res Response object used to send back the HTTP response
     */
    getSessionsByStation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { stationId } = req.params;
                const sessions = yield this.sessionService.getSessionsByStation(stationId);
                return res.status(200).json({
                    message: `Station sessions ID ${stationId} found.`,
                    data: sessions,
                });
            }
            catch (error) {
                return this.handleError(error, res);
            }
        });
    }
    /**
     * Helper for error handling based on error message
     */
    handleError(error, res) {
        const msg = error.message || 'Internal Server Error';
        if (msg.toLowerCase().includes('not found'))
            return res.status(404).json({ message: msg });
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('required'))
            return res.status(400).json({ message: msg });
        return res.status(500).json({ message: msg });
    }
}
exports.default = ChargerSessionController;
