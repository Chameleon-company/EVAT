import React from "react";
import NavBar from "../components/NavBar";
import WeatherMapComponent from "../components/WeatherMapComponent";

export default function WeatherRouting() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white">
      <NavBar />

      <main className="relative min-h-[calc(100vh-64px)] overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-50 via-emerald-50/40 to-transparent dark:from-emerald-950/30 dark:via-emerald-950/10 dark:to-transparent" />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="mb-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              Smart Navigation
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Weather-Aware{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                Routing
              </span>
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
              Plan your journey with weather conditions and route information
              to support safer and more efficient travel.
            </p>
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-emerald-900/60 dark:bg-[#050806] dark:shadow-emerald-950/20">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-emerald-900/60 sm:px-5">
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Weather Routing Map
                </h2>

                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Check weather conditions and routing information for your
                  journey.
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Weather Active
              </div>
            </div>

            <div className="relative min-h-[500px] bg-slate-100 dark:bg-[#020403]">
              <WeatherMapComponent />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}