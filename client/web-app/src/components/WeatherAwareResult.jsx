import React, { useState } from "react";

const WeatherAwareResult = ({ result }) => {
    const [showDetails, setShowDetails] = useState(false);

    if (!result) {
        return null;
    }

    const formatNumber = (value, decimals = 1) => {
        if (value === null || value === undefined || value === "") return "N/A";

        const number = Number(value);
        return Number.isNaN(number) ? "N/A" : number.toFixed(decimals);
    };

    const cleanInstruction = (instruction) => {
        if (!instruction) return "N/A";

        return instruction
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    };

    const formatDuration = (minutes) => {
        if (!minutes && minutes !== 0) return "N/A";

        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = Math.round(minutes % 60);
            return `${hours}h ${mins}m`;
        }

        return `${Math.round(minutes)} min`;
    };

    const weather = result.weather || {};
    const chargingStops = result.charging_stops || [];
    const steps = result.steps || [];

    const weatherText =
        weather.temp_c !== undefined
            ? `${formatNumber(weather.temp_c)}°C`
            : "N/A";

    return (
        <>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.statusRow}>
                        <span style={styles.statusDot}></span>
                        <span style={styles.statusText}>ROUTE CALCULATED</span>
                    </div>

                    <span style={styles.chargingBadge}>
                        {result.charging_required
                            ? `${chargingStops.length} charging stop`
                            : "No charging stop"}
                    </span>
                </div>

                <div style={styles.grid}>
                    <SummaryItem
                        icon="〽️"
                        label="Distance"
                        value={`${formatNumber(result.distance_km)} km`}
                    />

                    <SummaryItem
                        icon="🕒"
                        label="Duration"
                        value={formatDuration(result.duration_in_traffic_min)}
                    />

                    <SummaryItem
                        icon="🚧"
                        label="Traffic"
                        value={result.traffic_condition || "N/A"}
                    />

                    <SummaryItem
                        icon="⚡"
                        label={result.ac_on ? "Energy (AC On)" : "Energy"}
                        value={`${formatNumber(result.energy_with_ac_kwh, 2)} kWh`}
                    />

                    <SummaryItem
                        icon="🔋"
                        label="SOC Needed"
                        value={`${formatNumber(result.soc_needed_pct)}%`}
                    />

                    <SummaryItem
                        icon="☁️"
                        label="Weather"
                        value={weatherText}
                    />
                </div>

                <button
                    type="button"
                    style={styles.detailButton}
                    onClick={() => setShowDetails(true)}
                >
                    See Full Detail <span style={styles.arrow}>→</span>
                </button>
            </div>

            {showDetails && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <button
                                type="button"
                                style={styles.closeButton}
                                onClick={() => setShowDetails(false)}
                            >
                                ×
                            </button>

                            <p style={styles.modalLabel}>⚡ TRIP PLAN</p>

                            <h2 style={styles.modalTitle}>
                                {result.origin_resolved || "Origin"} →{" "}
                                {result.destination_resolved || "Destination"}
                            </h2>

                            <div style={styles.modalQuickStats}>
                                <span>〽️ {formatNumber(result.distance_km)} km</span>
                                <span>🕒 {formatDuration(result.duration_in_traffic_min)}</span>
                                <span>
                                    🔌{" "}
                                    {result.charging_required
                                        ? `${chargingStops.length} stop`
                                        : "No stop"}
                                </span>
                                <span>⚡ {formatNumber(result.energy_with_ac_kwh, 2)} kWh</span>
                            </div>
                        </div>

                        <div style={styles.modalBody}>
                            <div style={styles.modalGrid}>
                                <div>
                                    <SectionTitle title="Energy Breakdown" />

                                    <div style={styles.energyBox}>
                                        <DetailRow
                                            label="Base consumption"
                                            value={`${formatNumber(result.energy_nominal_kwh, 2)} kWh`}
                                        />

                                        <DetailRow
                                            label="AC energy usage"
                                            value={`${formatNumber(
                                                result.energy_with_ac_kwh - result.energy_nominal_kwh,
                                                2
                                            )} kWh`}
                                        />

                                        <DetailRow
                                            label="SOC needed"
                                            value={`${formatNumber(result.soc_needed_pct)}%`}
                                        />

                                        <DetailRow
                                            label="SOC with contingency"
                                            value={`${formatNumber(
                                                result.soc_with_contingency_pct
                                            )}%`}
                                        />

                                        <div style={styles.totalEnergyRow}>
                                            <span>Total energy</span>
                                            <strong>
                                                {formatNumber(result.energy_with_ac_kwh, 2)} kWh
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <SectionTitle title="Weather Conditions" />

                                    <div style={styles.weatherGrid}>
                                        <MiniDetailCard
                                            icon="🌡️"
                                            label="Temperature"
                                            value={`${formatNumber(weather.temp_c)}°C`}
                                        />

                                        <MiniDetailCard
                                            icon="💨"
                                            label="Wind"
                                            value={`${formatNumber(weather.wind_speed_ms, 2)} m/s`}
                                        />

                                        <MiniDetailCard
                                            icon="🧭"
                                            label="Wind Direction"
                                            value={`${formatNumber(weather.wind_deg, 0)}°`}
                                        />

                                        <MiniDetailCard
                                            icon="🚧"
                                            label="Traffic"
                                            value={result.traffic_condition || "N/A"}
                                        />
                                    </div>

                                    <SectionTitle title="Charging Stop" />

                                    {result.charging_required && chargingStops.length > 0 ? (
                                        <div style={styles.chargingStopBox}>
                                            <strong>{chargingStops[0].name}</strong>
                                            <p>{chargingStops[0].address}</p>
                                            <div style={styles.stopTags}>
                                                <span>⭐ {chargingStops[0].rating || "N/A"}</span>
                                                <span>
                                                    {chargingStops[0].open_now ? "Open now" : "Status N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={styles.noChargingBox}>
                                            No charging stop is required for this route.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const SummaryItem = ({ icon, label, value }) => {
    return (
        <div style={styles.summaryItem}>
            <div style={styles.icon}>{icon}</div>
            <p style={styles.summaryLabel}>{label}</p>
            <p style={styles.summaryValue}>{value}</p>
        </div>
    );
};

const SectionTitle = ({ title }) => {
    return <h3 style={styles.sectionTitle}>{title}</h3>;
};

const DetailRow = ({ label, value }) => {
    return (
        <div style={styles.detailRow}>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
};

const MiniDetailCard = ({ icon, label, value }) => {
    return (
        <div style={styles.miniDetailCard}>
            <div style={styles.icon}>{icon}</div>
            <p style={styles.summaryLabel}>{label}</p>
            <p style={styles.summaryValue}>{value}</p>
        </div>
    );
};

const styles = {
    card: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "18px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        fontFamily: "inherit",
        color: "#111827",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "14px",
    },

    statusRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },

    statusDot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        backgroundColor: "#16a34a",
    },

    statusText: {
        fontSize: "13px",
        fontWeight: "700",
        color: "#166534",
    },

    chargingBadge: {
        backgroundColor: "#ecfdf5",
        color: "#166534",
        padding: "6px 10px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: "700",
    },

    grid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
    },

    summaryItem: {
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "10px 12px",
        minHeight: "72px",
    },

    icon: {
        fontSize: "14px",
        marginBottom: "6px",
        color: "#16a34a",
        fontWeight: "700",
    },

    summaryLabel: {
        margin: 0,
        color: "#374151",
        fontSize: "12px",
        fontWeight: "700",
    },

    summaryValue: {
        margin: "5px 0 0 0",
        color: "#111827",
        fontSize: "17px",
        fontWeight: "700",
        textTransform: "capitalize",
    },

    detailButton: {
        marginTop: "12px",
        width: "100%",
        border: "none",
        borderRadius: "10px",
        backgroundColor: "#16a34a",
        color: "#ffffff",
        padding: "11px",
        fontSize: "14px",
        fontWeight: "700",
        cursor: "pointer",
    },

    arrow: {
        marginLeft: "8px",
    },

    modalOverlay: {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        zIndex: 5000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
    },

    modal: {
        width: "960px",
        maxWidth: "96vw",
        maxHeight: "88vh",
        overflowY: "auto",
        backgroundColor: "#f3f4f6",
        borderRadius: "18px",
        boxShadow: "0 30px 80px rgba(0, 0, 0, 0.35)",
    },

    modalHeader: {
        position: "relative",
        background: "linear-gradient(135deg, #43a047, #65c84f)",
        color: "#ffffff",
        padding: "28px 32px",
    },

    closeButton: {
        position: "absolute",
        top: "16px",
        right: "16px",
        width: "30px",
        height: "30px",
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.7)",
        backgroundColor: "transparent",
        color: "#ffffff",
        fontSize: "22px",
        cursor: "pointer",
    },

    modalLabel: {
        margin: "0 0 12px 0",
        fontSize: "13px",
        fontWeight: "900",
        letterSpacing: "0.16em",
    },

    modalTitle: {
        margin: "0 0 22px 0",
        fontSize: "24px",
        fontWeight: "900",
    },

    modalQuickStats: {
        display: "flex",
        flexWrap: "wrap",
        gap: "18px",
        fontSize: "18px",
        fontWeight: "700",
    },

    modalBody: {
        padding: "28px 32px 34px",
    },

    modalGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "28px",
    },

    sectionTitle: {
        margin: "0 0 14px 0",
        color: "#64748b",
        fontSize: "18px",
        fontWeight: "900",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
    },

    energyBox: {
        backgroundColor: "#ffffff",
        borderRadius: "18px",
        padding: "20px",
    },

    detailRow: {
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        fontSize: "16px",
        color: "#111827",
    },

    totalEnergyRow: {
        marginTop: "10px",
        backgroundColor: "#dcfce7",
        color: "#166534",
        borderRadius: "12px",
        padding: "12px 14px",
        display: "flex",
        justifyContent: "space-between",
        fontSize: "16px",
        fontWeight: "800",
    },

    weatherGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        marginBottom: "24px",
    },

    miniDetailCard: {
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        padding: "15px",
        minHeight: "90px",
    },

    chargingStopBox: {
        backgroundColor: "#dcfce7",
        color: "#14532d",
        borderRadius: "16px",
        padding: "18px",
    },

    stopTags: {
        display: "flex",
        gap: "10px",
        marginTop: "10px",
    },

    noChargingBox: {
        backgroundColor: "#dcfce7",
        color: "#166534",
        borderRadius: "16px",
        padding: "18px",
        fontWeight: "800",
    },

    stepsList: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginTop: "12px",
    },

    stepItem: {
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        padding: "14px",
        border: "1px solid #e5e7eb",
    },

    emptyText: {
        color: "#6b7280",
        fontWeight: "700",
    },
};

export default WeatherAwareResult;