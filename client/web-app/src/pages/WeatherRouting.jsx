import React from "react";
import NavBar from "../components/NavBar";
import WeatherMapComponent from "../components/WeatherMapComponent";

export default function WeatherAwareRouting() {
  return (
    <>
      <NavBar />
      <main className="relative h-(--content-height) overflow-auto">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-b from-emerald-50 via-emerald-50/40 to-transparent dark:from-emerald-950/30 dark:via-emerald-950/10 dark:to-transparent" />

        <div className="relative mx-auto w-full h-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          
          <section className="mx-auto mb-12 max-w-3xl text-center sm:mb-14">
            <span
              className="
                mb-4 inline-flex items-center rounded-full
                border border-emerald-200 bg-emerald-50
                px-3.5 py-1.5 text-xs font-semibold uppercase
                text-emerald-700
                dark:border-emerald-900/70
                dark:bg-emerald-950/50
                dark:text-emerald-400
              "
            >
              Route Planning
            </span>

            <h1 className="text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl lg:text-6xl">
              Weather-Aware{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                Routing
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-surface-500 sm:text-base sm:leading-7 dark:text-surface-700/75">
              Plan safer and more efficient journeys using real-time weather
              conditions and route information.
            </p>
          </section>

          <section className="overflow-hidden rounded-2xl border border-surface-200 bg-background shadow-sm dark:border-emerald-900/60 dark:shadow-emerald-950/20 h-full">
            <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3 dark:border-emerald-900/60 sm:px-5">
              <div>
                <h2 className="text-base font-semibold text-surface-800">
                  Weather Route Map
                </h2>

                <p className="mt-0.5 text-xs text-surface-600">
                  View weather conditions along your selected route.
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Live Weather
              </div>
            </div>

            <div className="relative bg-surface-100 h-full">
              <WeatherMapComponent />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}