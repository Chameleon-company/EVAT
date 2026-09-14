import { useState, useEffect, useContext } from "react";
import EnvironmentalImpact from "../components/EnvironmentalImpact";
import NavBar from "../components/NavBar";
import { UserContext } from "../context/user";

const API_URL = import.meta.env.VITE_API_URL;

export default function EnvironmentalImpactPage() {
  const { user } = useContext(UserContext);
  const [allElectricVehicles, setAllElectricVehicles] = useState([]);
  const [makes, setMakes] = useState(["Select"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for user context to hydrate
    if (user === null) return;

    if (!user?.token) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/vehicle`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const items = (data.data || data || []).map((v) => ({
          ...v,
          id: v.id || v._id,
          year: v.year || v.model_release_year,
        }));

        setAllElectricVehicles(items);
        setMakes(["Select", ...new Set(items.map((v) => v.make))]);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div
      className="
        min-h-screen
        overflow-x-hidden
        bg-slate-50
        text-slate-900
        transition-colors
        duration-300
        dark:bg-black
        dark:text-white
      "
    >
      <NavBar />

      <main className="relative min-h-[calc(100vh-70px)] overflow-hidden">
        {/* Background decoration */}
        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            top-0
            h-72
            bg-gradient-to-b
            from-emerald-50
            via-emerald-50/40
            to-transparent
            dark:from-emerald-950/30
            dark:via-emerald-950/10
            dark:to-transparent
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-0
            h-[500px]
            w-[700px]
            -translate-x-1/2
            rounded-full
            bg-emerald-100/30
            blur-3xl
            dark:bg-emerald-950/20
          "
        />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <div
              className="
                mb-3
                inline-flex
                items-center
                rounded-full
                border
                border-emerald-200
                bg-emerald-100
                px-3
                py-1
                text-sm
                font-medium
                text-emerald-700
                dark:border-emerald-800/60
                dark:bg-emerald-950/50
                dark:text-emerald-400
              "
            >
              Environmental Analysis
            </div>

            <h1
              className="
                text-3xl
                font-extrabold
                tracking-tight
                text-slate-900
                sm:text-4xl
                dark:text-white
              "
            >
              EV vs ICE{" "}
              <span
                className="
                  text-emerald-600
                  dark:text-emerald-400
                "
              >
                Environmental Impact
              </span>
            </h1>

            <p
              className="
                mt-3
                max-w-2xl
                text-sm
                leading-6
                text-slate-500
                sm:text-base
                dark:text-slate-400
              "
            >
              Compare CO₂ emissions, fuel consumption, and overall
              environmental footprint between electric and internal
              combustion vehicles.
            </p>
          </div>

          {/* Loading user context */}
          {user === null && (
            <div
              className="
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                dark:border-emerald-900/50
                dark:bg-[#050806]
                dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]
              "
            >
              <div
                className="
                  h-5
                  w-5
                  animate-spin
                  rounded-full
                  border-2
                  border-emerald-200
                  border-t-emerald-600
                  dark:border-emerald-900
                  dark:border-t-emerald-400
                "
              />

              <p
                className="
                  text-sm
                  font-medium
                  text-slate-600
                  dark:text-slate-300
                "
              >
                Loading your account...
              </p>
            </div>
          )}

          {/* No authenticated user */}
          {user !== null && !user?.token && (
            <div
              className="
                rounded-xl
                border
                border-red-200
                bg-red-50
                p-5
                dark:border-red-500/30
                dark:bg-red-950/30
              "
            >
              <div className="flex items-start gap-3">
                <div
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-red-100
                    text-red-600
                    dark:bg-red-950
                    dark:text-red-400
                  "
                >
                  !
                </div>

                <div>
                  <h2
                    className="
                      font-semibold
                      text-red-800
                      dark:text-red-300
                    "
                  >
                    Authentication required
                  </h2>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-red-600
                      dark:text-red-400
                    "
                  >
                    Please log in to access the Environmental Impact
                    analysis.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Authenticated user */}
          {user !== null && user?.token && (
            <>
              {loading ? (
                <div
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    p-8
                    shadow-sm
                    dark:border-emerald-900/50
                    dark:bg-[#050806]
                    dark:shadow-[0_12px_35px_rgba(0,0,0,0.35)]
                  "
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div
                      className="
                        h-8
                        w-8
                        animate-spin
                        rounded-full
                        border-2
                        border-emerald-200
                        border-t-emerald-600
                        dark:border-emerald-900
                        dark:border-t-emerald-400
                      "
                    />

                    <p
                      className="
                        mt-4
                        text-sm
                        font-semibold
                        text-slate-700
                        dark:text-slate-200
                      "
                    >
                      Loading vehicles...
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-slate-400
                        dark:text-slate-500
                      "
                    >
                      Preparing your environmental comparison.
                    </p>
                  </div>
                </div>
              ) : (
                <section
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-4
                    shadow-sm
                    transition-colors
                    duration-300
                    sm:p-6
                    dark:border-emerald-900/50
                    dark:bg-[#030504]
                    dark:shadow-[0_15px_40px_rgba(0,0,0,0.35)]
                  "
                >
                  <EnvironmentalImpact
                    user={user}
                    allElectricVehicles={allElectricVehicles}
                    makes={makes}
                  />
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}