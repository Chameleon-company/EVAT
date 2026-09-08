import React from "react";
import NavBar from "../components/NavBar";
import WeatherMapComponent from "../components/WeatherMapComponent";

export default function WeatherAwareRouting() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <NavBar />

      <main className="relative min-h-[calc(100vh-64px)] overflow-hidden">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-50 via-emerald-50/40 to-transparent" />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6">
            <div className="mb-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              Route Planning
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Weather-Aware{" "}
              <span className="text-emerald-600">Routing</span>
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Plan safer and more efficient journeys using real-time weather
              conditions and route information.
            </p>
          </div>

          {/* Map Card */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Weather Route Map
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  View weather conditions along your selected route.
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live Weather
              </div>
            </div>

            <div className="relative min-h-[500px]">
              <WeatherMapComponent />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}