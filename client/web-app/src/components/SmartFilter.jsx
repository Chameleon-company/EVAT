import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from './Button';

/**
 * SmartFilter Component
 *
 * A comprehensive filtering modal for EV charging stations that allows users to:
 * - Filter by charger type
 * - Filter by charging speed
 * - Set price range
 * - Toggle availability filter
 * - Toggle congestion overlay
 */
const SmartFilter = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  filteredCount,
  priceMin,
  priceMax,
  connectorTypes,
  operatorTypes,
}) => {
  const chargingSpeeds = [
    "<7kW",
    "7-22kW",
    "22-50kW",
    "50-150kW",
    "150kW-250kW",
    "250kW+",
  ];

  const modalRef = useRef(null);

  // -----------------------------
  // Charger Type
  // -----------------------------
  const handleChargerTypeToggle = (type) => {
    setFilters((prev) => ({
      ...prev,
      chargerType: prev.chargerType.includes(type)
        ? prev.chargerType.filter((t) => t !== type)
        : [...prev.chargerType, type],
    }));
  };

  // -----------------------------
  // Charging Speed
  // -----------------------------
  const handleChargingSpeedToggle = (speed) => {
    setFilters((prev) => ({
      ...prev,
      chargingSpeed: prev.chargingSpeed.includes(speed)
        ? prev.chargingSpeed.filter((s) => s !== speed)
        : [...prev.chargingSpeed, speed],
    }));
  };

  // -----------------------------
  // Price Range
  // -----------------------------
  const handleMinChange = (e) => {
    const newMin = parseInt(e.target.value, 10);

    setFilters((prev) => ({
      ...prev,
      priceRange: [
        Math.min(newMin, prev.priceRange[1]),
        prev.priceRange[1],
      ],
    }));
  };

  const handleMaxChange = (e) => {
    const newMax = parseInt(e.target.value, 10);

    setFilters((prev) => ({
      ...prev,
      priceRange: [
        prev.priceRange[0],
        Math.max(newMax, prev.priceRange[0]),
      ],
    }));
  };

  // -----------------------------
  // Operator
  // -----------------------------
  const handleOperatorToggle = (type) => {
    setFilters((prev) => ({
      ...prev,
      operatorType: prev.operatorType.includes(type)
        ? prev.operatorType.filter((o) => o !== type)
        : [...prev.operatorType, type],
    }));
  };

  // -----------------------------
  // Availability
  // -----------------------------
  const handleAvailabilityToggle = () => {
    setFilters((prev) => ({
      ...prev,
      showOnlyAvailable: !prev.showOnlyAvailable,
    }));
  };

  // -----------------------------
  // Congestion
  // -----------------------------
  const handleCongestionToggle = () => {
    setFilters((prev) => ({
      ...prev,
      showCongestion: !prev.showCongestion,
    }));
  };

  // -----------------------------
  // Reset
  // -----------------------------
  const handleReset = () => {
    setFilters({
      chargerType: [],
      chargingSpeed: [],
      priceRange: [priceMin, priceMax],
      operatorType: [],
      showOnlyAvailable: false,
      showCongestion: true,
    });
  };

  // -----------------------------
  // Apply
  // -----------------------------
  const handleApplyFilter = () => {
    onClose();
  };

  // -----------------------------
  // Close when clicking outside
  // -----------------------------
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // -----------------------------
  // Reusable Toggle Switch
  // -----------------------------
  const ToggleSwitch = ({ checked, onChange, label }) => {
    return (
      <Button
        type="button"
        variant="unstyled"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-1 ${
          checked
            ? "border-emerald-500 bg-emerald-500"
            : "border-slate-300 bg-slate-300"
        }`}
      >
        {/* Toggle knob */}
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </Button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* =========================
            HEADER
        ========================== */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h4 className="text-lg font-bold text-slate-900">
              Filters
            </h4>

            <p className="mt-0.5 text-xs text-slate-500">
              Refine charging stations
            </p>
          </div>

          <Button
            type="button"
            variant="unstyled"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            aria-label="Close filters"
          >
            <X size={19} />
          </Button>
        </div>

        {/* =========================
            SCROLLABLE CONTENT
        ========================== */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* =========================
              CHARGER TYPE
          ========================== */}
          <section className="py-2">
            <h5 className="mb-3 text-center text-sm font-semibold text-slate-800">
              Charger Type
            </h5>

            <div className="flex flex-wrap justify-center gap-2">
              {connectorTypes.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant="options"
                  size="tiny"
                  onClick={() => handleChargerTypeToggle(type)}
                  className={`px-3 py-2 hover:translate-y-0 hover:shadow-none ${
                    filters.chargerType.includes(type) ? 'selected hover:shadow-sm' : ''
                  }`}
                >
                  {type}
                </Button>
              ))}
            </div>
          </section>

          <div className="my-4 border-t border-slate-200" />

          {/* =========================
              CHARGING SPEED
          ========================== */}
          <section className="py-2">
            <h5 className="mb-3 text-center text-sm font-semibold text-slate-800">
              Charging Speed
            </h5>

            <div className="flex flex-wrap justify-center gap-2">
              {chargingSpeeds.map((speed) => (
                <Button
                  key={speed}
                  type="button"
                  variant="options"
                  size="tiny"
                  onClick={() => handleChargingSpeedToggle(speed)}
                  className={`px-3 py-2 hover:translate-y-0 hover:shadow-none ${
                    filters.chargingSpeed.includes(speed) ? 'selected hover:shadow-sm' : ''
                  }`}
                >
                  {speed}
                </Button>
              ))}
            </div>
          </section>

          <div className="my-4 border-t border-slate-200" />

          {/* =========================
              PRICE RANGE
          ========================== */}
          <section className="py-2">
            <h5 className="mb-4 text-center text-sm font-semibold text-slate-800">
              Price Range (¢ per kWh)
            </h5>

            <div className="px-2">
              <div className="relative">
                <input
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-500"
                  type="range"
                  min={priceMin}
                  max={priceMax}
                  value={filters.priceRange[0]}
                  onChange={handleMinChange}
                />

                <input
                  className="-mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-transparent accent-emerald-600"
                  type="range"
                  min={priceMin}
                  max={priceMax}
                  value={filters.priceRange[1]}
                  onChange={handleMaxChange}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{priceMin}</span>

                <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  {filters.priceRange[0]} - {filters.priceRange[1]}
                </span>

                <span>{priceMax}</span>
              </div>
            </div>
          </section>

          <div className="my-4 border-t border-slate-200" />

          {/* =========================
              CHARGER OPERATOR
          ========================== */}
          <section className="py-2">
            <h5 className="mb-3 text-center text-sm font-semibold text-slate-800">
              Charger Operator
            </h5>

            <div className="flex flex-wrap justify-center gap-2">
              {operatorTypes.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant="options"
                  size="tiny"
                  onClick={() => handleOperatorToggle(type)}
                  className={`px-3 py-2 hover:translate-y-0 hover:shadow-none ${
                    filters.operatorType.includes(type) ? 'selected hover:shadow-sm' : ''
                  }`}
                >
                  {type}
                </Button>
              ))}
            </div>
          </section>

          <div className="my-4 border-t border-slate-200" />

          {/* =========================
              AVAILABILITY
          ========================== */}
          <section className="py-2">
            <h5 className="mb-3 text-center text-sm font-semibold text-slate-800">
              Availability
            </h5>

            <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm leading-5 text-slate-600">
                Show only available stations?
              </span>

              <ToggleSwitch
                checked={filters.showOnlyAvailable}
                onChange={handleAvailabilityToggle}
                label="Show only available stations"
              />
            </div>
          </section>

          <div className="my-4 border-t border-slate-200" />

          {/* =========================
              CONGESTION
          ========================== */}
          <section className="py-2">
            <h5 className="mb-3 text-center text-sm font-semibold text-slate-800">
              Congestion Icons
            </h5>

            <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm leading-5 text-slate-600">
                Show predicted congestion icons?
              </span>

              <ToggleSwitch
                checked={filters.showCongestion}
                onChange={handleCongestionToggle}
                label="Show predicted congestion icons"
              />
            </div>
          </section>
        </div>

        {/* =========================
            FOOTER
        ========================== */}
        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4">
          <h5 className="mb-4 text-center text-sm font-semibold text-slate-700">
            {filteredCount} Station
            {filteredCount !== 1 ? "s" : ""} found
          </h5>

          <div className="flex gap-3">
            {/* Reset */}
            <Button
              type="button"
              variant="transparent"
              onClick={handleReset}
              className="flex-1 text-slate-600 hover:translate-y-0 hover:shadow-none"
            >
              Reset
            </Button>

            {/* Apply */}
            <Button
              type="button"
              onClick={handleApplyFilter}
              className="flex-1 hover:translate-y-0"
            >
              Apply Filter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartFilter;
