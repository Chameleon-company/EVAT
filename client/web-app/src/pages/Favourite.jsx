// NOTE: Further potential developments:
// Limit the number of chargers displayed per page
// and add new pages to manage many favourite stations.
// Freeze column header while scrolling for easier viewing.

import { useContext } from "react";

import NavBar from "../components/NavBar";
import { FavouritesContext } from "../context/FavouritesContext";
import ChatBubble from "../components/ChatBubble";
import { Button } from "../components/Button";

function Favourite() {
  const { favourites, toggleFavourite, loading, error } =
    useContext(FavouritesContext);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fafafa] text-slate-900 transition-colors dark:bg-transparent dark:text-white">
      <NavBar />

      <div
        className="
          pointer-events-none fixed inset-0 -z-0
          bg-gradient-to-br from-slate-50 via-white to-emerald-50/60
          dark:bg-none
        "
      />

      <div
        className="
          pointer-events-none fixed left-1/2 top-0 -z-0
          h-[420px] w-[700px] -translate-x-1/2 rounded-full
          bg-emerald-100/40 blur-3xl
          dark:bg-emerald-950/20
        "
      />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <section className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <span
            className="
              mb-4 inline-flex items-center rounded-full
              border border-emerald-200 bg-emerald-50
              px-3.5 py-1.5 text-[11px] font-semibold uppercase
              tracking-[0.18em] text-emerald-700
              dark:border-emerald-900/70
              dark:bg-emerald-950/50
              dark:text-emerald-400
            "
          >
            Saved Stations
          </span>

          <h1
            className="
              text-4xl font-bold tracking-tight text-slate-900
              sm:text-5xl
              dark:text-white
            "
          >
            My Favourite{" "}
            <span className="text-emerald-600 dark:text-emerald-400">
              Stations
            </span>
          </h1>

          <p
            className="
              mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-500
              sm:text-base
              dark:text-gray-400
            "
          >
            Quickly access and manage the charging stations you have saved.
          </p>
        </section>

        {error && (
          <div
            className="
              mx-auto mb-6 max-w-6xl rounded-xl border
              border-red-200 bg-red-50 px-4 py-3
              text-sm font-medium text-red-700
              dark:border-red-900/60
              dark:bg-red-950/30
              dark:text-red-400
            "
          >
            Error loading favourites: {error}
          </div>
        )}

        {loading && !error && (
          <div
            className="
              mx-auto flex max-w-6xl items-center justify-center
              rounded-2xl border border-slate-200 bg-white
              px-6 py-12 shadow-sm
              dark:border-gray-800
              dark:bg-[#050806]
              dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)]
            "
          >
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-gray-400">
              <div
                className="
                  h-5 w-5 animate-spin rounded-full border-2
                  border-slate-200 border-t-emerald-500
                  dark:border-gray-700 dark:border-t-emerald-400
                "
              />
              Loading favourite stations...
            </div>
          </div>
        )}

        {!loading && !error && favourites.length === 0 && (
          <div
            className="
              mx-auto max-w-2xl rounded-2xl border
              border-slate-200 bg-white p-8 text-center shadow-sm
              transition-all duration-300
              hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md
              sm:p-10
              dark:border-gray-800
              dark:bg-[#050806]/90
              dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)]
              dark:hover:border-emerald-900
              dark:hover:shadow-[0_15px_40px_rgba(16,185,129,0.08)]
            "
          >
            <div
              className="
                mx-auto flex h-14 w-14 items-center justify-center
                rounded-full border border-emerald-200
                bg-emerald-50 text-2xl text-emerald-600
                dark:border-emerald-900/70
                dark:bg-emerald-950/60
                dark:text-emerald-400
              "
            >
              ♥
            </div>

            <h2 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
              No favourite stations yet
            </h2>

            <p
              className="
                mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500
                dark:text-gray-400
              "
            >
              Go to the map and ❤️ a station to save it here for quick access
              later.
            </p>
          </div>
        )}

        {!loading && !error && favourites.length > 0 && (
          <section
            className="
              mx-auto max-w-6xl overflow-hidden rounded-2xl border
              border-slate-200 bg-white shadow-sm
              transition-all duration-300
              hover:border-emerald-200 hover:shadow-md
              dark:border-gray-800
              dark:bg-[#050806]/95
              dark:shadow-[0_15px_45px_rgba(0,0,0,0.45)]
              dark:hover:border-emerald-900
              dark:hover:shadow-[0_15px_45px_rgba(16,185,129,0.07)]
            "
          >
            <div
              className="
                flex flex-col gap-2 border-b border-slate-200
                px-5 py-5 sm:flex-row sm:items-center
                sm:justify-between sm:px-6
                dark:border-gray-800
              "
            >
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Saved Charging Stations
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                  {favourites.length}{" "}
                  {favourites.length === 1 ? "station" : "stations"} saved
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-gray-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                Favourite stations
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-sm">
                <thead
                  className="
                    border-b border-slate-200 bg-slate-50
                    dark:border-gray-800
                    dark:bg-[#08100c]
                  "
                >
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold text-slate-600 dark:text-gray-300">
                      Operator
                    </th>

                    <th className="px-5 py-4 text-center font-semibold text-slate-600 dark:text-gray-300">
                      Type
                    </th>

                    <th className="px-5 py-4 text-center font-semibold text-slate-600 dark:text-gray-300">
                      Power
                    </th>

                    <th className="px-5 py-4 text-center font-semibold text-slate-600 dark:text-gray-300">
                      Cost
                    </th>

                    <th className="px-5 py-4 text-center font-semibold text-slate-600 dark:text-gray-300">
                      Charging Points
                    </th>

                    <th className="px-5 py-4 text-center font-semibold text-slate-600 dark:text-gray-300">
                      Status
                    </th>

                    <th className="px-5 py-4 text-center font-semibold text-slate-600 dark:text-gray-300">
                      Favourite
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-gray-800/80">
                  {favourites.map((st) => {
                    const isRestricted = st.access_key_required === "true";

                    return (
                      <tr
                        key={st._id}
                        className="
                          group transition-all duration-200
                          hover:bg-emerald-50/50
                          dark:hover:bg-emerald-950/20
                        "
                      >
                        <td className="px-5 py-4 text-left">
                          <div
                            className="
                              font-medium text-slate-900
                              transition-colors duration-200
                              group-hover:text-emerald-700
                              dark:text-gray-100
                              dark:group-hover:text-emerald-400
                            "
                          >
                            {st.operator || "Unknown"}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center text-slate-600 dark:text-gray-400">
                          {st.connection_type || "Unknown"}
                        </td>

                        <td className="px-5 py-4 text-center text-slate-600 dark:text-gray-400">
                          {st.power_output
                            ? `${st.power_output} kW`
                            : "N/A kW"}
                        </td>

                        <td className="px-5 py-4 text-center text-slate-600 dark:text-gray-400">
                          {st.cost || "Unknown"}
                        </td>

                        <td className="px-5 py-4 text-center text-slate-600 dark:text-gray-400">
                          {st.charging_points || 0}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                              isRestricted
                                ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isRestricted
                                  ? "bg-red-500"
                                  : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
                              }`}
                            />

                            {isRestricted ? "Closed" : "Open"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <Button
                            type="button"
                            variant="unstyled"
                            onClick={() => toggleFavourite(st)}
                            className="
                              inline-flex items-center gap-2 rounded-lg
                              border border-red-200 bg-white px-3 py-2
                              text-xs font-semibold text-red-600
                              transition-all duration-200
                              hover:-translate-y-0.5 hover:border-red-300
                              hover:bg-red-50 hover:shadow-sm
                              focus:outline-none focus:ring-2
                              focus:ring-red-200
                              dark:border-red-900/70
                              dark:bg-red-950/20
                              dark:text-red-400
                              dark:hover:border-red-800
                              dark:hover:bg-red-950/40
                              dark:hover:shadow-[0_0_15px_rgba(239,68,68,0.08)]
                              dark:focus:ring-red-900
                            "
                          >
                            <span className="text-sm">♥</span>
                            Unsave
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              className="
                border-t border-slate-200 bg-slate-50
                px-5 py-4 sm:px-6
                dark:border-gray-800
                dark:bg-[#08100c]
              "
            >
              <p className="text-xs text-slate-400 dark:text-gray-500">
                You can remove a station from your favourites at any time.
              </p>
            </div>
          </section>
        )}
      </main>

      <ChatBubble />
    </div>
  );
}

export default Favourite;