import React, { useEffect, useRef, useState } from "react";

export default function WeatherAwareSelection({
    originLocation,
    destinationLocation,
    activeField,
    setActiveField,
    acOn,
    setAcOn,
    weatherError,
    weatherLoading,
    onClick,
    handleReset,
    isDark,
    onPlaceSelect,
}) {
    const originInputRef = useRef(null);
    const destinationInputRef = useRef(null);

    const [googleLoaded, setGoogleLoaded] = useState(false);

    // Load Google Maps + Places script
    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            console.log("Google Maps API key is missing.");
            return;
        }

        if (window.google && window.google.maps && window.google.maps.places) {
            setGoogleLoaded(true);
            return;
        }

        const existingScript = document.getElementById("google-maps-script");

        if (existingScript) {
            existingScript.addEventListener("load", () => {
                setGoogleLoaded(true);
            });
            return;
        }

        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=beta`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            setGoogleLoaded(true);
        };

        script.onerror = () => {
            console.log("Failed to load Google Maps script.");
        };

        document.body.appendChild(script);
    }, []);

    // Attach Google Places autocomplete to both inputs
    useEffect(() => {
        if (!googleLoaded) return;

        if (!originInputRef.current || !destinationInputRef.current) return;

        if (!window.google?.maps?.places?.Autocomplete) {
            console.log("Google Places Autocomplete is not available.");
            return;
        }

        const originAutocomplete = new window.google.maps.places.Autocomplete(
            originInputRef.current,
            {
                fields: ["formatted_address", "name", "geometry"],
                componentRestrictions: { country: "au" },
            }
        );

        const destinationAutocomplete = new window.google.maps.places.Autocomplete(
            destinationInputRef.current,
            {
                fields: ["formatted_address", "name", "geometry"],
                componentRestrictions: { country: "au" },
            }
        );

        originAutocomplete.addListener("place_changed", () => {
            const place = originAutocomplete.getPlace();
            handleGooglePlace("origin", place);
        });

        destinationAutocomplete.addListener("place_changed", () => {
            const place = destinationAutocomplete.getPlace();
            handleGooglePlace("destination", place);
        });
    }, [googleLoaded]);


    // When user clicks map, sync selected address into input boxes
    useEffect(() => {
        if (originInputRef.current && originLocation?.address) {
            originInputRef.current.value = originLocation.address;
        }
    }, [originLocation]);

    useEffect(() => {
        if (destinationInputRef.current && destinationLocation?.address) {
            destinationInputRef.current.value = destinationLocation.address;
        }
    }, [destinationLocation]);

    const handleGooglePlace = (fieldName, place) => {
        if (!place || !place.geometry) {
            return;
        }

        const selectedPlace = {
            address: place.formatted_address || place.name,
            lat: place.geometry.location.lat(),
            lon: place.geometry.location.lng(),
        };

        onPlaceSelect(fieldName, selectedPlace);
    };

    const handleLocalReset = () => {
        if (originInputRef.current) {
            originInputRef.current.value = "";
        }

        if (destinationInputRef.current) {
            destinationInputRef.current.value = "";
        }

        handleReset();
    };

    const inputStyle = (fieldName) => ({
        width: "100%",
        padding: "11px 12px",
        borderRadius: "10px",
        border:
            activeField === fieldName
                ? "2px solid #22c55e"
                : "1px solid #d1d5db",
        outline: "none",
        fontSize: "14px",
        fontWeight: "600",
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        color: isDark ? "#ffffff" : "#111827",
        boxSizing: "border-box",
    });

    const helperTextStyle = {
        marginTop: "6px",
        marginBottom: "12px",
        padding: "7px 10px",
        borderRadius: "8px",
        backgroundColor: "#ecfdf5",
        color: "#166534",
        fontSize: "12px",
        fontWeight: "700",
        textAlign: "center",
    };

    const labelStyle = {
        display: "block",
        marginBottom: "6px",
        fontSize: "13px",
        fontWeight: "700",
        color: isDark ? "#e5e7eb" : "#374151",
    };

    const cardStyle = {
        position: "absolute",
        top: "20px",
        left: "20px",
        right: "auto",
        zIndex: 1000,
        width: "360px",
        maxWidth: "calc(100% - 40px)",
        backgroundColor: isDark ? "#111827" : "#ffffff",
        borderRadius: "16px",
        padding: "18px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    };

    const buttonStyle = {
        width: "100%",
        padding: "11px",
        borderRadius: "10px",
        border: "none",
        backgroundColor: "#16a34a",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: "700",
        cursor: weatherLoading ? "not-allowed" : "pointer",
        opacity: weatherLoading ? 0.7 : 1,
        marginTop: "12px",
    };

    const resetButtonStyle = {
        width: "100%",
        padding: "10px",
        borderRadius: "10px",
        border: "1px solid #d1d5db",
        backgroundColor: isDark ? "#1f2937" : "#f9fafb",
        color: isDark ? "#ffffff" : "#374151",
        fontSize: "14px",
        fontWeight: "700",
        cursor: "pointer",
        marginTop: "8px",
    };

    const toggleWrapperStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "12px",
        padding: "10px 12px",
        borderRadius: "10px",
        backgroundColor: isDark ? "#1f2937" : "#f9fafb",
    };

    return (
        <div style={cardStyle}>
            <h3
                style={{
                    margin: "0 0 14px 0",
                    fontSize: "18px",
                    color: isDark ? "#ffffff" : "#111827",
                }}
            >
                Weather-Aware Routing
            </h3>

            <div>
                <label style={labelStyle}>Origin</label>
                <input
                    ref={originInputRef}
                    type="text"
                    placeholder="Type origin or click map"
                    onFocus={() => setActiveField("origin")}
                    style={inputStyle("origin")}
                />

                {activeField === "origin" && !originLocation?.address && (
                    <div style={helperTextStyle}>
                        Type an origin or click the map to fill origin
                    </div>
                )}
            </div>

            <div>
                <label style={labelStyle}>Destination</label>
                <input
                    ref={destinationInputRef}
                    type="text"
                    placeholder="Type destination or click map"
                    onFocus={() => setActiveField("destination")}
                    style={inputStyle("destination")}
                />

                {activeField === "destination" && !destinationLocation?.address && (
                    <div style={helperTextStyle}>
                        Type a destination or click the map to fill destination
                    </div>
                )}
            </div>

            <div style={toggleWrapperStyle}>
                <span
                    style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: isDark ? "#ffffff" : "#374151",
                    }}
                >
                    Air Conditioning
                </span>

                <label
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        color: isDark ? "#ffffff" : "#374151",
                        fontWeight: "700",
                        fontSize: "13px",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={acOn}
                        onChange={(e) => setAcOn(e.target.checked)}
                    />
                    {acOn ? "On" : "Off"}
                </label>
            </div>

            {weatherError && (
                <div
                    style={{
                        marginTop: "12px",
                        padding: "9px 10px",
                        borderRadius: "8px",
                        backgroundColor: "#fef2f2",
                        color: "#991b1b",
                        fontSize: "13px",
                        fontWeight: "700",
                    }}
                >
                    {weatherError}
                </div>
            )}

            <button
                type="button"
                onClick={onClick}
                disabled={weatherLoading}
                style={buttonStyle}
            >
                {weatherLoading ? "Calculating..." : "Calculate Energy"}
            </button>

            <button
                type="button"
                onClick={handleLocalReset}
                style={resetButtonStyle}
            >
                Reset
            </button>
        </div>
    );
}