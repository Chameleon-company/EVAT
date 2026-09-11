import React from "react";
import NavBar from "../components/NavBar";
import InsightsDisplay from "../components/InsightsDisplay";




export default function PersonalisedInsights() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <NavBar />
            <InsightsDisplay />
        </div>
    );
}
