import mongoose from "mongoose";
import ChargingStationRepository from "../repositories/station-repository";

export type VoiceIntent =
  | "get_congestion"
  | "find_nearest_station"
  | "find_low_cost_station"
  | "compare_cost"
  | "help"
  | "unknown";

export interface VoiceQueryResult {
  answer_text: string;
  intent: VoiceIntent;
  entities: {
    station?: string;
    comparison?: string;
    congestion?: string;
    congestion_level?: string;
  };
  station_id: string | null;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
}

export interface VoiceQueryContext {
  user_location?: {
    lat: number;
    lng: number;
  };
  map_center?: {
    lat: number;
    lng: number;
  };
}

export default class VoiceService {
  async processQuery(
    query: string,
    context?: VoiceQueryContext
  ): Promise<VoiceQueryResult> {
    const normalizedQuery = query.trim().toLowerCase();
    const entities = this.extractEntities(normalizedQuery);
    const intent = this.detectIntent(normalizedQuery);
    const stationReference = await this.resolveStationReference(
      entities.station,
      normalizedQuery
    );
    const nearestStation = await this.resolveNearestStation(context);

    switch (intent) {
      case "get_congestion":
        const congestionTarget = stationReference ?? nearestStation;
        return {
          answer_text: congestionTarget
            ? `I found a station match and it will be show on the sidebar.`
            : "I can help with congestion checks. Please mention a station name or allow location for accurate map highlighting.",
          intent,
          entities: {
            ...entities,
            congestion: "medium",
            congestion_level: "low",
          },
          station_id: congestionTarget?.station_id ?? null,
          coordinates: congestionTarget?.coordinates ?? null,
        };
      case "find_low_cost_station":
        const cheapestStation = await this.resolveCheapestStation();
        return {
          answer_text: cheapestStation
            ? "I found the cheapest charging station and prepared it on the sidebar."
            : "I can help find the cheapest charging station, but I could not resolve pricing data.",
          intent,
          entities,
          station_id: cheapestStation?.station_id ?? null,
          coordinates: cheapestStation?.coordinates ?? null,
        };
      case "compare_cost":
        const costTarget = stationReference ?? nearestStation;
        return {
          answer_text: costTarget
            ? "I can help with EV vs ICE cost comparison for the selected charger."
            : "I can help with EV vs ICE cost comparison. Please share location or charger name to attach a charger ID.",
          intent,
          entities,
          station_id: costTarget?.station_id ?? null,
          coordinates: costTarget?.coordinates ?? null,
        };
      case "find_nearest_station":
        return {
          answer_text: nearestStation
            ? "I found the nearest charging station and prepared it on the left sidebar."
            : "I can help find the nearest charging station, but I need location context to select one accurately.",
          intent,
          entities: {
            ...entities,
            congestion: "medium",
          },
          station_id: nearestStation?.station_id ?? null,
          coordinates: nearestStation?.coordinates ?? null,
        };
      case "help":
        return {
          answer_text:
            "Try asking about station congestion or EV cost comparison. Example: 'Compare EV and petrol costs'.",
          intent,
          entities,
          station_id: null,
          coordinates: null,
        };
      default:
        return {
          answer_text:
            "I could not confidently identify that request yet. Try asking about congestion, costs, or help.",
          intent: "unknown",
          entities,
          station_id: null,
          coordinates: null,
        };
    }
  }

  private detectIntent(query: string): VoiceIntent {
    if (/(congestion|busy|crowd|wait)/.test(query)) {
      return "get_congestion";
    }
    if (/(cheapest|cheap|lowest cost|low cost|best price|affordable)/.test(query)) {
      return "find_low_cost_station";
    }
    if (/(nearest|nearby|closest|near me)/.test(query)) {
      return "find_nearest_station";
    }
    if (/(compare|cost|price|ev|petrol|diesel|ice)/.test(query)) {
      return "compare_cost";
    }
    if (/(help|how to|what can you do|commands)/.test(query)) {
      return "help";
    }
    return "unknown";
  }

  private extractEntities(query: string): VoiceQueryResult["entities"] {
    const entities: VoiceQueryResult["entities"] = {};

    const stationMatch =
      query.match(/station\s+([a-z0-9_-]+)/i) ||
      query.match(/(?:congestion|busy|wait)\s+(?:at|in|near)?\s*([a-z0-9_-]+)/i);
    if (stationMatch && stationMatch[1]) {
      entities.station = stationMatch[1];
    }

    if (/(ev.*(petrol|diesel|ice))|((petrol|diesel|ice).*ev)/.test(query)) {
      entities.comparison = "ev_vs_ice";
    }

    return entities;
  }

  private async resolveStationReference(
    station: string | undefined,
    fullQuery: string
  ): Promise<{
    station_id: string;
    coordinates: { lat: number; lng: number };
  } | null> {
    const candidates = this.getStationCandidates(station, fullQuery);
    if (candidates.length < 1) return null;

    // If user passes a station id directly, validate against DB.
    for (const candidate of candidates) {
      if (mongoose.Types.ObjectId.isValid(candidate)) {
        const byId = await ChargingStationRepository.findById(candidate);
        if (byId) {
          const lat = byId.latitude ?? byId.location?.coordinates?.[1];
          const lng = byId.longitude ?? byId.location?.coordinates?.[0];
          if (typeof lat === "number" && typeof lng === "number") {
            return {
              station_id: String((byId as any)._id),
              coordinates: { lat, lng },
            };
          }
        }
      }
    }

    // Fallback lookup using operator text so we can still return real station ids.
    for (const candidate of candidates) {
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches = await ChargingStationRepository.findAll({
        operator: { $regex: escaped, $options: "i" },
      });
      const first = matches[0] as any;
      if (!first) continue;

      const lat = first.latitude ?? first.location?.coordinates?.[1];
      const lng = first.longitude ?? first.location?.coordinates?.[0];
      if (typeof lat !== "number" || typeof lng !== "number") continue;

      return {
        station_id: String(first._id),
        coordinates: { lat, lng },
      };
    }

    return null;
  }

  private getStationCandidates(
    station: string | undefined,
    fullQuery: string
  ): string[] {
    const results = new Set<string>();

    if (station) {
      results.add(station.trim().toLowerCase());
    }

    const locationPhrase =
      fullQuery.match(/(?:at|in|near)\s+([a-z0-9_-]+)/i)?.[1] ||
      fullQuery.match(/(?:congestion|busy|wait)\s+([a-z0-9_-]+)/i)?.[1];
    if (locationPhrase) {
      results.add(locationPhrase.trim().toLowerCase());
    }

    // Handle common singular/plural mismatch, e.g. dockland <-> docklands.
    const expanded = Array.from(results);
    for (const word of expanded) {
      if (word.endsWith("s")) {
        results.add(word.slice(0, -1));
      } else {
        results.add(`${word}s`);
      }
    }

    return Array.from(results).filter((v) => v.length > 1);
  }

  private async resolveNearestStation(
    context?: VoiceQueryContext
  ): Promise<{
    station_id: string;
    coordinates: { lat: number; lng: number };
  } | null> {
    const center = context?.map_center ?? context?.user_location;
    if (!center) return null;

    const nearest = (await ChargingStationRepository.findNearest({
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [center.lng, center.lat],
          },
        },
      },
    })) as any;

    if (!nearest) return null;

    const lat = nearest.latitude ?? nearest.location?.coordinates?.[1];
    const lng = nearest.longitude ?? nearest.location?.coordinates?.[0];
    if (typeof lat !== "number" || typeof lng !== "number") return null;

    return {
      station_id: String(nearest._id),
      coordinates: { lat, lng },
    };
  }

  private async resolveCheapestStation(): Promise<{
    station_id: string;
    coordinates: { lat: number; lng: number };
  } | null> {
    const stations = (await ChargingStationRepository.findAll({
      is_operational: "true",
    })) as any[];

    const withParsedCost = stations
      .map((station) => ({
        station,
        parsedCost: this.parseCostToCents(station.cost),
      }))
      .filter((entry) => entry.parsedCost !== null)
      .sort((a, b) => (a.parsedCost as number) - (b.parsedCost as number));

    const cheapest = withParsedCost[0]?.station;
    if (!cheapest) return null;

    const lat = cheapest.latitude ?? cheapest.location?.coordinates?.[1];
    const lng = cheapest.longitude ?? cheapest.location?.coordinates?.[0];
    if (typeof lat !== "number" || typeof lng !== "number") return null;

    return {
      station_id: String(cheapest._id),
      coordinates: { lat, lng },
    };
  }

  private parseCostToCents(costValue: unknown): number | null {
    if (typeof costValue !== "string" || !costValue.trim()) return null;
    const lower = costValue.toLowerCase().trim();

    if (lower.includes("free")) return 0;

    const centsMatch = lower.match(/([\d.]+)\s*(c|cent|cents)\b/);
    if (centsMatch && centsMatch[1]) {
      return Math.round(parseFloat(centsMatch[1]));
    }

    const dollarMatch = lower.match(/\$([\d.]+)/);
    if (dollarMatch && dollarMatch[1]) {
      return Math.round(parseFloat(dollarMatch[1]) * 100);
    }

    const numMatch = lower.match(/([\d.]+)/);
    if (numMatch && numMatch[1]) {
      return Math.round(parseFloat(numMatch[1]));
    }

    return null;
  }
}
