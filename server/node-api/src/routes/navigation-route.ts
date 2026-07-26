import express from "express";
import { createRouteFromPoints, createRouteFromSentence } from "../controllers/navigation-controller";

const router = express.Router();

/**
 * @swagger
 * {
 *   "/api/navigation/from-points": {
 *     "post": {
 *       "tags": ["Navigation"],
 *       "summary": "Create a route from points",
 *       "description": "Generates a navigation route given start and destination coordinates",
 *       "requestBody": {
 *         "required": true,
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "type": "object",
 *               "properties": {
 *                 "start": {
 *                   "type": "object",
 *                   "properties": {
 *                     "lat": { "type": "number", "example": -37.8477516 },
 *                     "lng": { "type": "number", "example": 145.1139689 }
 *                   },
 *                   "required": ["lat", "lng"]
 *                 },
 *                 "destination": {
 *                   "type": "object",
 *                   "properties": {
 *                     "lat": { "type": "number", "example": -37.8104952 },
 *                     "lng": { "type": "number", "example": 144.9627499 }
 *                   },
 *                   "required": ["lat", "lng"]
 *                 }
 *               },
 *               "required": ["origin", "destination"]
 *             }
 *           }
 *         }
 *       },
 *       "responses": {
 *         "200": {
 *           "description": "Route successfully generated",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "properties": {
 *                   "message": { "type": "string", "example": "success" },
 *                   "route": { "type": "array", "items": { "type": "object" } }
 *                 }
 *               }
 *             }
 *           }
 *         },
 *         "400": { "description": "Invalid input" },
 *         "500": { "description": "Server error" }
 *       }
 *     }
 *   }
 * }
 */
router.post("/from-points", createRouteFromPoints);

/**
 * @swagger
 * {
 *   "/api/navigation/from-sentence": {
 *     "post": {
 *       "tags": ["Navigation"],
 *       "summary": "Create a route from sentence",
 *       "description": "Generates a navigation route from a sentence like 'Take me from X to Y while visiting Z'",
 *       "requestBody": {
 *         "required": true,
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "type": "object",
 *               "properties": {
 *                 "sentence": {
 *                   "type": "string",
 *                   "example": "Take me from Deakin Burwood to "
 *                 }
 *               },
 *               "required": ["sentence"]
 *             }
 *           }
 *         }
 *       },
 *       "responses": {
 *         "200": {
 *           "description": "Route successfully generated",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "properties": {
 *                   "message": { "type": "string", "example": "success" },
 *                   "route": { "type": "array", "items": { "type": "object" } }
 *                 }
 *               }
 *             }
 *           }
 *         },
 *         "400": { "description": "Invalid input" },
 *         "500": { "description": "Server error" }
 *       }
 *     }
 *   }
 * }
 */
router.post("/from-sentence", createRouteFromSentence);

export default router;
