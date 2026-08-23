import { useNavigate } from "react-router-dom";
import { useState } from "react";

const useCases = [
  {
    id: "cost-comparison",
    title: "Cost Comparison",
    description:
      "Compare the total cost of owning an EV vs a petrol vehicle over time.",
    icon: "💰",
    route: "/cost",
    status: "live",
  },
  {
    id: "environmental-impact",
    title: "Environmental Impact",
    description:
      "Analyse carbon emissions and sustainability metrics for EV adoption.",
    icon: "🌿",
    route: "/environmental-impact",
    status: "live",
  },
  {
    id: "demand-forecasting",
    title: "Demand Forecasting",
    description:
      "Predict future EV demand trends across regions using ML models.",
    icon: "📈",
    route: "/demand-forecasting",
    status: "live",
  },
  {
    id: "personalised-insights",
    title: "Personalised EV Insights",
    description:
      "Get personalised recommendations based on your driving habits and lifestyle.",
    icon: "🔍",
    route: "/insights-form",
    status: "live",
  },
  {
    id: "congestion-prediction",
    title: "Congestion Prediction",
    description:
      "Forecast charging station congestion to optimise your travel planning.",
    icon: "🚦",
    route: "/map",
    status: "live",
  },
  {
    id: "weather-routing",
    title: "Weather-Aware Routing",
    description:
      "Get optimal EV routes factoring in weather, terrain, and range impact.",
    icon: "🗺️",
    route: "/weather-aware-routing",
    status: "live",
  },
  {
    id: "chatbot",
    title: "EV Assistant",
    description:
      "Ask our AI assistant anything about EVs, charging, and adoption.",
    icon: "🤖",
    route: "/chatbot",
    status: "live",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <main className="min-h-screen bg-[#fafafa] text-slate-900">
      {/* Subtle background accent */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-100/40 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        {/* Header */}
        <section className="mx-auto mb-12 max-w-3xl text-center sm:mb-14">
          <span className="mb-5 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            EVAT Platform
          </span>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Electric Vehicle
            <span className="block text-emerald-600">
              Adoption Tool
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">
            Explore insights, predictions and analysis to better understand
            electric vehicle adoption, charging and mobility.
          </p>
        </section>

        {/* Section heading */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Explore use cases
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose an area to get started.
            </p>
          </div>

          <div className="hidden text-xs font-medium text-slate-400 sm:block">
            {useCases.length} available
          </div>
        </div>

        {/* Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((uc) => {
            const isHovered = hoveredId === uc.id;
            const isComingSoon = uc.status === "coming-soon";

            return (
              <button
                key={uc.id}
                type="button"
                disabled={isComingSoon}
                onMouseEnter={() => setHoveredId(uc.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => !isComingSoon && navigate(uc.route)}
                className={`group relative flex min-h-[230px] flex-col rounded-2xl border bg-white p-6 text-left transition-all duration-300 ${
                  isComingSoon
                    ? "cursor-not-allowed border-slate-200 opacity-50"
                    : isHovered
                      ? "-translate-y-1 border-emerald-200 shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
                      : "border-slate-200 shadow-sm hover:border-emerald-200 hover:shadow-md"
                }`}
              >
                {/* Top accent */}
                <div
                  className={`absolute left-6 right-6 top-0 h-[2px] rounded-full bg-emerald-500 transition-opacity duration-300 ${
                    isHovered && !isComingSoon
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                />

                {/* Icon */}
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition-all duration-300 ${
                    isHovered
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-100 bg-slate-50"
                  }`}
                >
                  {uc.icon}
                </div>

                {/* Card content */}
                <div className="mt-5 flex-1">
                  <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                    {uc.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {uc.description}
                  </p>
                </div>

                {/* Footer */}
                {!isComingSoon && (
                  <div
                    className={`mt-5 flex items-center text-sm font-semibold text-emerald-600 transition-all duration-300 ${
                      isHovered
                        ? "translate-x-0 opacity-100"
                        : "translate-x-[-6px] opacity-0"
                    }`}
                  >
                    Explore
                    <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                )}

                {isComingSoon && (
                  <span className="mt-5 w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Coming Soon
                  </span>
                )}
              </button>
            );
          })}
        </section>

        {/* Bottom information */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-slate-400">
            More use cases will be added as the project progresses.
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            EVAT Platform
          </div>
        </div>
      </div>
    </main>
  );
}