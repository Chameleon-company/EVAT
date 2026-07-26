import { Router } from "express";
import UserService from "../services/user-service";
import { authGuard } from "../middlewares/auth-middleware";
import PersonalisedEVInsightsService from "../services/personalised-ev-insights-service";
import PersonalisedEVInsightsController from "../controllers/personalised-ev-insights-controller";

const router = Router();

const userService = new UserService();
const personalisedEVInsightsService = new PersonalisedEVInsightsService();

const personalisedEVInsightsController = new PersonalisedEVInsightsController(
  userService,
  personalisedEVInsightsService
);

/**
 * @swagger
 * components:
 *   schemas:
 *    InsightsResponse:
 *      type: object
 *      properties:
 *        userId:
 *          type: string
 *        email:
 *          type: string
 *        weekly_km:
 *          type: number
 *        trip_length:
 *          type: string
 *        driving_frequency:
 *          type: string
 *        driving_type:
 *          type: string
 *        road_trips:
 *          type: string
 *        car_ownership:
 *          type: string
 *        fuel_efficiency:
 *          type: number
 *        monthly_fuel_spend:
 *          type: number
 *        home_charging:
 *          type: string
 *        solar_panels:
 *          type: string
 *        charging_preference:
 *          type: string
 *        budget:
 *          type: string
 *        priorities:
 *          type: string
 *        postcode:
 *          type: string
 *        cluster:
 *          type: number
 *        profile_type:
 *          type: string
 *        description:
 *          type: string
 *        estimatedSavings:
 *          type: number
 *        savingsMessage:
 *          type: string
 *        similarDriverAverages:
 *          type: object
 *          properties:
 *            weekly_km:
 *              type: number
 *            fuel_efficiency:
 *              type: number
 *            monthly_fuel_spend:
 *              type: number
 *        allDriverAverages:
 *          type: object
 *          properties:
 *            weekly_km:
 *              type: number
 *            fuel_efficiency:
 *              type: number
 *            monthly_fuel_spend:
 *              type: number
 *        comparison:
 *          type: object
 *          properties:
 *            sim_weekly_km_difference:
 *              type: number
 *            sim_fuel_efficiency_difference:
 *              type: number
 *            sim_monthly_fuel_spend_difference:
 *              type: number
 *            all_weekly_km_difference:
 *              type: number
 *            all_fuel_efficiency_difference:
 *              type: number
 *            all_monthly_fuel_spend_difference:
 *              type: number
 * 
 */
/**
 * @swagger
 * /api/personalised-ev-insights:
 *  post:
 *    tags:
 *      - Insights
 *    summary: Submit insights
 *    description: Submit a new insights form
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - userId 
 *              - email
 *              - weekly_km
 *              - trip_length
 *              - driving_frequency
 *              - driving_type
 *              - road_trips
 *              - car_ownership
 *              - fuel_efficiency
 *              - monthly_fuel_spend
 *              - home_charging
 *              - solar_panels
 *              - charging_preference
 *              - budget
 *              - priorities
 *              - postcode
 *            properties:
 *              userId:
 *                type: string
 *                maxLength: 24
 *              email:
 *                type: string
 *                format: email
 *                example: "johndoe@example.com"
 *                maxLength: 255
 *              weekly_km:
 *                type: number
 *                example: 250
 *                minimum: 0
 *              trip_length:
 *                type: string
 *                maxLength: 48
 *              driving_frequency:
 *                type: string
 *                maxLength: 48
 *              driving_type:
 *                type: string
 *                maxLength: 100
 *              road_trips:
 *                type: string
 *                maxLength: 3
 *              car_ownership:
 *                type: string
 *                maxLength: 22
 *              fuel_efficiency:
 *                type: number
 *                minimum: 0 
 *              monthly_fuel_spend:
 *                type: number
 *                minimum: 0
 *              home_charging:
 *                type: string
 *                maxLength: 3
 *              solar_panels:
 *                type: string
 *                maxLength: 3
 *              charging_preference:
 *                type: string
 *                maxLength: 16
 *              budget:
 *                type: string
 *                maxLength: 32
 *              priorities:
 *                type: string
 *                maxLength: 255
 *              postcode:
 *                type: string
 *                example: "3000"
 *                maxLength: 4
 *    responses:
 *      201:
 *        description: Insights submitted successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: "Personalised EV insight generated and saved successfully"
 *                data:
 *                  $ref: '#/components/schemas/InsightsResponse'   
 *      400:
 *        description: Bad request - validation error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *      404:
 *        description: Bad request - user not found
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 * 
 */
router.post("/", authGuard(["user", "admin"]), (req, res) =>
  personalisedEVInsightsController.submitInsights(req, res)
);

/**
 * @swagger
 * /api/personalised-ev-insights/latest:
 *  get:
 *    tags:
 *      - Insights
 *    summary: get EV Usage Insights
 *    description: Get EV Usage Insights based on latest form submission
 *    security:
 *      - bearerAuth: []
 *    responses:
 *      200:
 *        description: Insight retrieved successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: "success"
 *                data:
 *                  type: object
 *                  properties:
 *                    userId:
 *                      type: string
 *                    email:
 *                      type: string
 *                    weekly_km:
 *                      type: number
 *                    trip_length:
 *                      type: string
 *                    driving_frequency:
 *                      type: string
 *                    driving_type:
 *                      type: string
 *                    road_trips:
 *                      type: string
 *                    car_ownership:
 *                      type: string
 *                    fuel_efficiency:
 *                      type: number
 *                    monthly_fuel_spend:
 *                      type: number
 *                    home_charging:
 *                      type: string
 *                    solar_panels:
 *                      type: string
 *                    charging_preference:
 *                      type: string
 *                    budget:
 *                      type: string
 *                    priorities:
 *                      type: string
 *                    postcode:
 *                      type: string
 *                    cluster:
 *                      type: number
 *                    profile_type:
 *                      type: string
 *                    description:
 *                      type: string
 *                    estimatedSavings:
 *                      type: number
 *                    savingsMessage:
 *                      type: string
 *                    similarDriverAverages:
 *                      type: object
 *                      properties:
 *                        weekly_km:
 *                          type: number
 *                        fuel_efficiency:
 *                          type: number
 *                        monthly_fuel_spend:
 *                          type: number
 *                    allDriverAverages:
 *                      type: object
 *                      properties:
 *                        weekly_km:
 *                          type: number
 *                        fuel_efficiency:
 *                          type: number
 *                        monthly_fuel_spend:
 *                          type: number
 *                    comparison:
 *                      type: object
 *                      properties:
 *                        sim_weekly_km_difference:
 *                          type: number
 *                        sim_fuel_efficiency_difference:
 *                          type: number
 *                        sim_monthly_fuel_spend_difference:
 *                          type: number
 *                        all_weekly_km_difference:
 *                          type: number
 *                        all_fuel_efficiency_difference:
 *                          type: number
 *                        all_monthly_fuel_spend_difference:
 *                          type: number
 *      404:
 *        description: Bad request -  No insights found for user
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: "No personalised EV insights found for this user"
 *      400:
 *        description: Unauthorised
 */
router.get("/latest", authGuard(["user", "admin"]), (req, res) =>
  personalisedEVInsightsController.getMyInsights(req, res)
);

export default router;