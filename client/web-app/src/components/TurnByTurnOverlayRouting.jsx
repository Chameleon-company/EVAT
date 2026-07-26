import React, { useState } from "react";

const TurnByTurnOverlay = ({ steps, isDark }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    if (!steps || steps.length === 0) {
        return null;
    }

    const cleanInstruction = (instruction) => {
        if (!instruction) return "No instruction available";

        return instruction
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    };

    const formatNumber = (value, decimals = 2) => {
        const number = Number(value);
        return Number.isNaN(number) ? "N/A" : number.toFixed(decimals);
    };

    const currentStep = steps[currentStepIndex];

    const handlePrevious = () => {
        setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
    };

    const handleNext = () => {
        setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.card(isDark)}>
                <div style={styles.heading}>Navigation Directions</div>
                <div style={styles.topRow}>
                    <span style={styles.badge}>
                        Step {currentStepIndex + 1} of {steps.length}
                    </span>

                    <span style={styles.distanceText(isDark)}>
                        {formatNumber(currentStep.distance_m / 1000)} km ·{" "}
                        {formatNumber(currentStep.duration_s / 60, 1)} min
                    </span>
                </div>

                <div style={styles.instruction(isDark)}>
                    {cleanInstruction(currentStep.instruction)}
                </div>

                <div style={styles.buttonRow}>
                    <button
                        type="button"
                        onClick={handlePrevious}
                        disabled={currentStepIndex === 0}
                        style={{
                            ...styles.navButton,
                            opacity: currentStepIndex === 0 ? 0.5 : 1,
                            cursor: currentStepIndex === 0 ? "not-allowed" : "pointer",
                        }}
                    >
                        Previous
                    </button>

                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={currentStepIndex === steps.length - 1}
                        style={{
                            ...styles.navButton,
                            opacity: currentStepIndex === steps.length - 1 ? 0.5 : 1,
                            cursor:
                                currentStepIndex === steps.length - 1
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: "absolute",
        top: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: "420px",
        maxWidth: "calc(100% - 40px)",
    },

    card: (isDark) => ({
        backgroundColor: isDark ? "#111827" : "#ffffff",
        borderRadius: "16px",
        padding: "14px 16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
    }),

    heading: {
        fontSize: "13px",
        fontWeight: "800",
        color: "#166534",
        marginBottom: "5px",
        textAlign: "center"
    },

    topRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
        gap: "12px",
    },

    badge: {
        backgroundColor: "#ecfdf5",
        color: "#166534",
        padding: "5px 9px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: "700",
    },

    distanceText: (isDark) => ({
        color: isDark ? "#d1d5db" : "#6b7280",
        fontSize: "12px",
        fontWeight: "700",
    }),

    instruction: (isDark) => ({
        color: isDark ? "#ffffff" : "#111827",
        fontSize: "15px",
        fontWeight: "700",
        lineHeight: "1.4",
        marginBottom: "12px",
    }),

    buttonRow: {
        display: "flex",
        gap: "8px",
    },

    navButton: {
        flex: 1,
        padding: "8px 10px",
        borderRadius: "10px",
        border: "1px solid #d1d5db",
        backgroundColor: "#f9fafb",
        color: "#374151",
        fontSize: "13px",
        fontWeight: "700",
    },
};

export default TurnByTurnOverlay;