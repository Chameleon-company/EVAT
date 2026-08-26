import React from "react";
import NavBar from "../components/NavBar";
import WeatherMapComponent from "../components/WeatherMapComponent";

export default function WeatherAwareRouting() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <NavBar />

      <main className="relative min-h-[calc(100vh-64px)] w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-64 bg-gradient-to-b from-emerald-50/70 to-transparent" />

        <div className="relative z-10 w-full">
          <WeatherMapComponent />
        </div>
      </main>
    </div>
  );
}