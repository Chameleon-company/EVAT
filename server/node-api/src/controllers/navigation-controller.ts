import { Request, Response } from "express";
import { Client } from "@googlemaps/google-maps-services-js";
import axios from "axios";

const mapsClient = new Client({});

// Gemini Pro response structure
interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

/**
 * Creates a route from the given initial starting location, ending destination, and any along the way stops
 * 
 * @param req Request object containing the start, stops and destinations to visit
 * @param res Response object used to send back the HTTP response 
 * @returns If error: returns an error message. If successful: returns the route in a JSON format 
 */
export const createRouteFromPoints = async (req: Request, res: Response) => {
  try {
    const { start, stops, destination } = req.body;

    if (!start || !destination) {
      return res.status(400).json({ message: "Start and destination are required." });
    }
    
    const response = await mapsClient.directions({
      params: {
        origin: start,
        destination: destination,
        waypoints: stops || [],
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });
    res.status(200).json({ route: response.data.routes[0] });
  } catch (err: any) {
    console.error(err);
    console.error("Directions API error:", err.message);
    res.status(500).json({ message: "Failed to get route", error: err.message });
  }
};


/**
 * Creates a route from the given text that contains the starting point, ending point and any other destinations to pass by
 * 
 * @param req A request object containing a string to be given to Google Gemini to extract a path from
 * @param res Respone object used to send back the HTTP response
 * @returns If error: returns an error message. If successful: returns the route in a JSON format
 */
export const createRouteFromSentence = async (req: Request, res: Response) => {
  try {
    const { sentence } = req.body;
    if (!sentence) {
      return res.status(400).json({ message: "Sentence is required." });
    }

    // Gemini Pro API call using correct model
    const geminiRes = await axios.post<GeminiResponse>(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Extract the start location, optional stops, and destination from this sentence: "${sentence}". Return only valid JSON like: { "start": "...", "stops": ["..."], "destination": "..." }`
              }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const text = geminiRes.data.candidates[0]?.content?.parts[0]?.text;
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
    } catch (parseErr) {
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
    const directionsRes = await mapsClient.directions({
      params: {
        origin: extracted.start,
        destination: extracted.destination,
        waypoints: extracted.stops || [],
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    res.status(200).json({ route: directionsRes.data.routes[0] });
  } catch (err: any) {
    console.error("Gemini error:", err.message);
    res.status(500).json({ message: "Error processing sentence", error: err.message });
  }
};