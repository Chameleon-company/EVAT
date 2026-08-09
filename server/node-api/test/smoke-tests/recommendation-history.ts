// Smoke test for model, repository and service.
// This script allows isolated testing without Jest, and without routes (and therefore API endpoints) having been implemented.

import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { IRecommendationCandidate } from "../../src/models/recommendation-history-model";
import RecommendationHistoryRepository from "../../src/repositories/recommendation-history-repository";
import RecommendationHistoryService from "../../src/services/recommendation-history-service";

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

async function main() {
    let mongo: MongoMemoryServer | undefined;

    try {
        console.log("Starting temporary MongoDB...");
        mongo = await MongoMemoryServer.create();
        await mongoose.connect(mongo.getUri());

        const repository = new RecommendationHistoryRepository();
        const service = new RecommendationHistoryService(repository);

        const userId = new Types.ObjectId();
        const selectedStationId = new Types.ObjectId();
        const otherStationId = new Types.ObjectId();

        // Declare  as IRecommendationCandidate[] so TypeScript will tell us if the model changes and this script has not been updated.
        const candidates: IRecommendationCandidate[] = [
            {
                stationId: selectedStationId,

                latitude: -37.81,
                longitude: 144.97,
                operator: "Test Charging Co",
                connectionType: "CCS",
                currentType: "DC",
                chargingPoints: 4,
                cost: "$0.50/kWh",
                payAtLocation: "yes",
                isOperational: true,
                membershipRequired: "no",
                accessKeyRequired: "no",

                distanceKm: 2.5,
                durationMin: 6,
                durationInTrafficMin: 8,
                roadTrafficCondition: "moderate",
                energyNominalKwh: 1.2,
                energyNeededKwh: 1.5,
                socWithContingencyPct: 35,
                temperatureC: 18,
                windSpeedMs: 4,
                windDirectionDeg: 180,
                congestionLevel: "medium",

                rank: 1,
                score: 92,
                reasons: ["Nearby", "Available chargers"],
            },
            {
                stationId: otherStationId,

                latitude: -37.82,
                longitude: 144.98,
                operator: null,
                connectionType: null,
                currentType: null,
                chargingPoints: null,
                cost: null,
                payAtLocation: null,
                isOperational: true,
                membershipRequired: null,
                accessKeyRequired: null,

                distanceKm: null,
                durationMin: null,
                durationInTrafficMin: null,
                roadTrafficCondition: null,
                energyNominalKwh: null,
                energyNeededKwh: null,
                socWithContingencyPct: null,
                temperatureC: null,
                windSpeedMs: null,
                windDirectionDeg: null,
                congestionLevel: "unknown",

                rank: 2,
                score: 50,
                reasons: [],
            },
        ];

        console.log("\n1. Creating a recommendation session...");

        // Create session
        const sessionId = await service.createSession({
            userId: userId.toString(),
            userLocation: {
                latitude: -37.8136,
                longitude: 144.9631,
            },
            candidates,
        });
        // Check if it created correctly.
        assert(sessionId, "The service did not return a session ID");
        console.log("   Created session:", sessionId.toString());

        // Check session can be retrieved from DB
        console.log("\n2. Reading it back from MongoDB...");
        const created = await repository.findById(sessionId.toString());
        assert(created, "The created session could not be retrieved");

        // Check session details were saved and can be read correctly
        assert(created.userId.equals(userId), "The stored user ID is incorrect");
        assert(created.candidates.length === 2, "Expected two candidates");
        // Check that optional fields not provided are null.
        assert(created.selection.stationId === null, "Initial station selection should be null");
        assert(created.selection.selectedAt === null, "Initial selection time should be null");
        // Check DB added timestamps
        assert(created.createdAt instanceof Date, "createdAt was not generated");
        assert(created.updatedAt instanceof Date, "updatedAt was not generated");

        // Output details of retreived session
        console.log("   Candidate count:", created.candidates.length);
        console.log("   First connection type:", created.candidates[0].connectionType);
        console.log("   Second operator:", created.candidates[1].operator);
        console.log("   Initial selection:", created.selection.stationId);

        // Attempt to log station selection
        console.log("\n3. Recording a station selection...");
        const selectedAt = new Date();

        await service.recordSelection(
            sessionId.toString(),
            selectedStationId.toString(),
            userId.toString(),
            selectedAt,
        );

        const updated = await repository.findById(sessionId.toString());

        // Check that details were saved succesfully.
        assert(updated, "The updated session could not be retrieved");
        assert(updated.selection.stationId, "The station selection was not saved");
        assert(
            updated.selection.stationId.equals(selectedStationId),
            "The wrong station was selected",
        );
        assert(updated.selection.selectedAt, "The selection time was not saved");
        assert(
            updated.selection.selectedAt.getTime() === selectedAt.getTime(),
            "The wrong selection time was saved",
        );

        // Output details of selected station
        console.log(
            "   Selected station:",
            updated.selection.stationId.toString(),
        );
        console.log("   Selected at:", updated.selection.selectedAt);

        // Attemnpt retrieval of recent sessions
        console.log("\n4. Retrieving the user's recent sessions...");

        const recent = await service.getRecentSessions(userId.toString());

        // Check if retrieved successfully
        assert(recent.length === 1, `Expected one session, found ${recent.length}`);
        assert(
            recent[0]._id.toString() === sessionId.toString(),
            "The wrong recent session was returned",
        );

        // Output details of session history
        console.log("   Sessions found:", recent.length);

        // Print test pass if we got to here.
        console.log("\n✅ Recommendation-history smoke test passed");
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        if (mongo) {
            await mongo.stop();
        }
    }
}

// If any assert() function above threw an error, the test failed.
main().catch((error) => {
    console.error("\n❌ Recommendation-history smoke test failed");
    console.error(error);
    process.exitCode = 1;
});