"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth-middleware");
const station_service_1 = __importDefault(require("../services/station-service"));
const station_controller_1 = __importDefault(require("../controllers/station-controller"));
const router = (0, express_1.Router)();
const stationService = new station_service_1.default();
const stationController = new station_controller_1.default(stationService);
/**
 * @swagger
 *  {
 *    "/api/chargers": {
 *      "get": {
 *        "tags": [
 *          "Chargers"
 *        ],
 *        "summary": "Get all chargers",
 *        "description": "Retrieve a list of all chargers",
 *        "security": [
 *          {
 *            "bearerAuth": []
 *          }
 *        ],
 *        "parameters": [
 *          {
 *            "in": "query",
 *            "name": "connector",
 *            "schema": {
 *              "type": "string"
 *            },
 *            "required": false,
 *            "description": "Connectors to filter for.<br>
 *                           Exact matches.<br>
 *                           Allows comma-separated string."
 *          },
 *          {
 *            "in": "query",
 *            "name": "current",
 *            "schema": {
 *              "type": "string"
 *            },
 *            "required": false,
 *            "description": "Current type to filter for.<br>
 *                           Accepts 'AC' ('AC (Single-Phase)'), 'AC3' ('AC (Three-Phase)'), and 'DC'.<br>
 *                           Allows comma-separated string."
 *          },
 *          {
 *            "in": "query",
 *            "name": "operator",
 *            "schema": {
 *              "type": "string"
 *            },
 *            "required": false,
 *            "description": "Operators to filter for.<br>
 *                           Exact matches.<br>
 *                           Allows comma-separated string."
 *          },
 *          {
 *            "in": "query",
 *            "name": "lat",
 *            "schema": {
 *              "type": "number"
 *            },
 *            "required": false,
 *            "description": "Latitude of search location.<br>
 *                           Required if lon or radius is present."
 *          },
 *          {
 *            "in": "query",
 *            "name": "lon",
 *            "schema": {
 *              "type": "number"
 *            },
 *            "required": false,
 *            "description": "Longitude of search location.<br>
 *                           Required if lat or radius is present."
 *          },
 *          {
 *            "in": "query",
 *            "name": "radius",
 *            "schema": {
 *              "type": "number"
 *            },
 *            "required": false,
 *            "description": "Radius of search location in Kilometers.<br>
 *                           Required if lat or lon is present."
 *          }
 *        ],
 *        "responses": {
 *          "200": {
 *            "description": "Successfully retrieved chargers list",
 *            "content": {
 *              "application/json": {
 *                "schema": {
 *                  "type": "object",
 *                  "properties": {
 *                    "message": {
 *                      "type": "string",
 *                      "example": "success"
 *                    },
 *                    "data": {
 *                      "type": "array",
 *                      "items": {
 *                        "$ref": "#/components/schemas/ChargingStation"
 *                      }
 *                    }
 *                  }
 *                }
 *              }
 *            }
 *          },
 *          "400": {
 *            "description": "Invalid parameter(s)"
 *          },
 *          "401": {
 *            "description": "Unauthorized"
 *          },
 *          "500": {
 *            "description": "Server error"
 *          }
 *        }
 *      }
 *    }
 *  }
 */
router.get("/", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => stationController.getAllStations(req, res));
/**
 * @swagger
{
 *      "/api/chargers/nearest-charger": {
 *          "get": {
 *              "tags": [
 *                  "Chargers"
 *              ],
 *              "summary": "Get nearest charger",
 *              "description": "Retrieves the nearest charger",
 *              "security": [
 *                  {
 *                      "bearerAuth": []
 *                  }
 *              ],
 *              "parameters": [
 *                  {
 *                      "in": "query",
 *                      "name": "connector",
 *                      "schema": {
 *                          "type": "string"
 *                      },
 *                      "required": false,
 *                      "description": "Connectors to filter for.<br>
 *                                     Exact matches.<br>
 *                                     Allows comma-separated string."
 *                  },
 *                  {
 *                      "in": "query",
 *                      "name": "current",
 *                      "schema": {
 *                          "type": "string"
 *                      },
 *                      "required": false,
 *                      "description": "Current type to filter for.<br>
 *                                     Accepts 'AC' ('AC (Single-Phase)'), 'AC3' ('AC (Three-Phase)'), and 'DC'.<br>
 *                                     Allows comma-separated string."
 *                  },
 *                  {
 *                      "in": "query",
 *                      "name": "operator",
 *                      "schema": {
 *                          "type": "string"
 *                      },
 *                      "required": false,
 *                      "description": "Operators to filter for.<br>
 *                              Exact matches.<br>
 *                              Allows comma-separated string."
 *                  },
 *                  {
 *                      "in": "query",
 *                      "name": "lat",
 *                      "schema": {
 *                          "type": "number"
 *                      },
 *                      "required": true,
 *                      "description": "Latitude of search location."
 *                  },
 *                  {
 *                      "in": "query",
 *                      "name": "lon",
 *                      "schema": {
 *                          "type": "number"
 *                      },
 *                      "required": true,
 *                      "description": "Longitude of search location."
 *                  }
 *              ],
 *              "responses": {
 *                  "200": {
 *                      "description": "Successfully retrieved chargers list",
 *                      "content": {
 *                          "application/json": {
 *                              "schema": {
 *                                  "type": "object",
 *                                  "properties": {
 *                                      "message": {
 *                                          "type": "string",
 *                                          "example": "success"
 *                                      },
 *                                      "data": {
 *                                          "type": "object",
 *                                          "$ref": "#/components/schemas/ChargingStation"
 *                                      }
 *                                  }
 *                              }
 *                          }
 *                      }
 *                  },
 *                  "400": {
 *                    "description": "Invalid parameter(s)"
 *                  },
 *                  "401": {
 *                      "description": "Unauthorized"
 *                  },
 *                  "500": {
 *                      "description": "Server error"
 *                  }
 *              }
 *          }
 *      }
 *  }
 */
router.get("/nearest-charger", (0, auth_middleware_1.authGuard)(['user', 'admin']), (req, res) => stationController.getNearestStation(req, res));
/**
 * @swagger
 * /api/chargers/{stationId}:
 *     get:
 *         tags:
 *             - Chargers
 *         summary: Get charger by ID
 *         description: Retrieves a charger by its ID
 *         security:
 *             -
 *                 bearerAuth: []
 *         parameters:
 *             -
 *                 in: path
 *                 name: stationId
 *                 schema:
 *                     type: string
 *                 required: true
 *                 description: Charger ID to find
 *         responses:
 *             '200':
 *                 description: Successfully retrieved chargers list
 *                 content:
 *                     application/json:
 *                         schema:
 *                             type: object
 *                             properties:
 *                                 message:
 *                                     type: string
 *                                     example: success
 *                                 data:
 *                                     type: object
 *                                     $ref: '#/components/schemas/ChargingStation'
 *             '400':
 *                 description: Invalid parameter(s)
 *             '401':
 *                 description: Unauthorized
 *             '500':
 *                 description: Server error
 */
router.get("/:stationId", (0, auth_middleware_1.authGuard)(["user", "admin"]), (req, res) => stationController.getStationById(req, res));
/**
 * @openapi
 * {
 *     "/api/chargers/GoogleMapsChargers": {
 *         "get": {
 *             "tags": [
 *                 "Chargers"
 *             ],
 *             "summary": "Get chargers from Google Maps",
 *             "description": "Retrieves the nearest chargers. <br> Returns: types, addressComponents, attributions, currentSecondaryOpeningHours, regularSecondaryOpeningHours, containingPlaces, name, id, nationalPhoneNumber, formattedAddress, location, googleMapsUri, websiteUri, currentOpeningHours, priceLevel, displayName, evChargeOptions, utcOffsetMinutes",
 *             "security": [
 *                 {
 *                     "bearerAuth": []
 *                 }
 *             ],
 *             "parameters": [
 *                 {
 *                     "in": "query",
 *                     "name": "lat",
 *                     "schema": {
 *                         "type": "number"
 *                     },
 *                     "required": true,
 *                     "description": "Latitude of search location."
 *                 },
 *                 {
 *                     "in": "query",
 *                     "name": "lon",
 *                     "schema": {
 *                         "type": "number"
 *                     },
 *                     "required": true,
 *                     "description": "Longitude of search location."
 *                 },
 *                 {
 *                     "in": "query",
 *                     "name": "radius",
 *                     "schema": {
 *                         "type": "number"
 *                     },
 *                     "required": true,
 *                     "description": "Radius of search location in kilometers."
 *                 },
 *                 {
 *                     "in": "query",
 *                     "name": "rank",
 *                     "schema": {
 *                         "type": "string"
 *                     },
 *                     "required": false,
 *                     "description": "Ranking of search results. <br> Expects 'popularity' or 'distance'. <br> Defaults to popularity."
 *                 }
 *             ],
 *             "responses": {
 *                 "200": {
 *                     "description": "Successfully retrieved chargers from Google Maps API",
 *                     "content": {
 *                         "application/json": {
 *                             "schema": {
 *                                 "type": "object",
 *                                 "properties": {
 *                                     "message": {
 *                                         "type": "string",
 *                                         "example": "success"
 *                                     },
 *                                     "data": {
 *                                         "type": "array",
 *                                         "items": {}
 *                                     }
 *                                 }
 *                             }
 *                         }
 *                     }
 *                 },
 *                 "400": {
 *                     "description": "Invalid parameter(s)"
 *                 },
 *                 "401": {
 *                     "description": "Unauthorized"
 *                 },
 *                 "500": {
 *                     "description": "Server error"
 *                 }
 *             }
 *         }
 *     }
 * }
 */
router.get("/GoogleMapsChargers", (0, auth_middleware_1.authGuard)(['user', 'admin;']), (req, res) => stationController.GetGoogleMapsStations(req, res));
exports.default = router;
