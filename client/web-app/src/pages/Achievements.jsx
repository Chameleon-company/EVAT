import { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/user";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import ChatBubble from "../components/ChatBubble";
import { Button } from "../components/Button";
import {
  Trophy,
  LockKeyhole,
  CheckCircle2,
  Zap,
  Gauge,
  Route,
  Leaf,
  Fuel,
  Flame,
  RotateCcw,
  Flag,
  Plus,
  Settings2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.DEV;

function Achievements() {
  const navigate = useNavigate();

  const {
    user: contextUser,
    setUser: setContextUser,
    updateUser: updateContextUser,
  } = useContext(UserContext);

  const [userStats, setUserStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCounter, setSelectedCounter] = useState("");
  const [counterValue, setCounterValue] = useState(0);
  const [selectedFlag, setSelectedFlag] = useState("");

  const token =
    contextUser?.token ||
    JSON.parse(localStorage.getItem("currentUser"))?.token;

  const fetchData = async () => {
    try {
      setLoading(true);

      const statsRes = await fetch(`${API_URL}/user-stats/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setUserStats(statsData.data);
      }

      const achRes = await fetch(`${API_URL}/achievements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (achRes.ok) {
        const achData = await achRes.json();
        setAchievements(achData.data || []);
      }
    } catch (err) {
      console.error("Failed to load achievements page:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCounter = async () => {
    if (!selectedCounter || !userStats?.userId) return;

    try {
      const res = await fetch(`${API_URL}/user-stats/test/increment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userStats.userId,
          counterName: selectedCounter,
          value: counterValue,
        }),
      });

      if (res.ok) {
        alert(`Added ${counterValue} to ${selectedCounter}`);
        setSelectedCounter("");
        setCounterValue(0);
        await fetchData();
      } else {
        alert("Failed to update");
      }
    } catch (err) {
      alert("Error updating counter");
    }
  };

  const handleSetFlagTrue = async () => {
    if (!selectedFlag || !userStats?.userId) return;

    try {
      const res = await fetch(`${API_URL}/user-stats/test/set-flag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userStats.userId,
          flagName: selectedFlag,
        }),
      });

      if (res.ok) {
        alert(`Set ${selectedFlag} to true`);
        setSelectedFlag("");
        await fetchData();
      }
    } catch (err) {
      alert("Error setting flag");
    }
  };

  const handleResetFlags = async () => {
    if (!userStats?.userId) return;

    try {
      const res = await fetch(`${API_URL}/user-stats/reset-flags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userStats.userId,
        }),
      });

      if (res.ok) {
        alert("Flags have been reset");
        await fetchData();
      }
    } catch (err) {
      alert("Error setting flag");
    }
  };

  const handleResetCounters = async () => {
    if (!userStats?.userId) return;

    try {
      const res = await fetch(`${API_URL}/user-stats/reset-counters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userStats.userId,
        }),
      });

      if (res.ok) {
        alert("Counters have been reset");
        await fetchData();
      }
    } catch (err) {
      alert("Error setting flag");
    }
  };

  const handleResetAll = async () => {
    if (!userStats?.userId) return;

    if (window.confirm("Reset ALL stats?")) {
      try {
        const res = await fetch(`${API_URL}/user-stats/reset`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: userStats.userId,
          }),
        });

        if (res.ok) {
          alert("All user stats have been reset");
          await fetchData();
        }
      } catch (err) {
        alert("Error resetting user stats");
      }
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/signin");
      return;
    }

    fetchData();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-black dark:text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-500/10 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Trophy className="h-6 w-6 animate-pulse" />
          </div>

          <p className="text-sm font-medium text-slate-500 dark:text-gray-400">
            Loading achievements...
          </p>
        </div>
      </div>
    );
  }

  const counters = userStats?.counters || {};
  const flags = userStats?.flags || {};

  const statItems = [
    {
      label: "Charging Sessions",
      value: counters.totalChargingSessions ?? 0,
      icon: Zap,
    },
    {
      label: "Energy Charged",
      value: `${((counters.totalWhCharged ?? 0) / 1000).toFixed(1)} kWh`,
      icon: Gauge,
    },
    {
      label: "Distance Travelled",
      value: `${((counters.totalMetresTravelled ?? 0) / 1000).toFixed(1)} km`,
      icon: Route,
    },
    {
      label: "CO₂ Avoided",
      value: `${counters.totalCO2KgAvoided ?? 0} kg`,
      icon: Leaf,
    },
    {
      label: "Petrol Savings",
      value: `$${((counters.totalPetrolSavingsCents ?? 0) / 100).toFixed(2)}`,
      icon: Fuel,
    },
    {
      label: "Login Streak",
      value: `${counters.consecutiveLoginDays ?? 0} days`,
      icon: Flame,
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-black dark:text-white">
      <NavBar />

      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute right-[-10rem] top-1/3 h-[32rem] w-[32rem] rounded-full bg-emerald-200/20 blur-3xl dark:bg-emerald-400/8" />
        <div className="absolute bottom-[-12rem] left-1/3 h-96 w-96 rounded-full bg-teal-200/15 blur-3xl dark:bg-teal-400/6" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 backdrop-blur-md dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Trophy className="h-3.5 w-3.5" />
              EVAT Achievements
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Your Achievements
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-gray-400 sm:text-base">
              Track your EV activity, unlock achievements and see your progress
              towards cleaner mobility.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-200/80 bg-white/70 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur-xl dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            {achievements.filter((achievement) => achievement.unlocked).length}{" "}
            unlocked
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-emerald-900/30 dark:bg-[#06100b]/75 dark:shadow-[0_20px_70px_rgba(0,0,0,0.45)]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-400/10" />

            <div className="relative">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <Trophy className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                    Your Progress
                  </p>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Profile Stats
                  </h2>
                </div>
              </div>

              {userStats ? (
                <div className="space-y-2">
                  {statItems.map((stat) => {
                    const Icon = stat.icon;

                    return (
                      <div
                        key={stat.label}
                        className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/60 dark:border-gray-800/80 dark:bg-black/20 dark:hover:border-emerald-900/60 dark:hover:bg-emerald-950/30"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                            <Icon className="h-4 w-4" />
                          </div>

                          <span className="truncate text-xs font-medium text-slate-500 dark:text-gray-400">
                            {stat.label}
                          </span>
                        </div>

                        <strong className="shrink-0 text-sm font-bold text-slate-900 dark:text-white">
                          {stat.value}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center dark:border-gray-800 dark:bg-black/20">
                  <p className="text-sm text-slate-500 dark:text-gray-400">
                    Unable to load stats.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="min-w-0 rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-2xl sm:p-6 dark:border-emerald-900/30 dark:bg-[#06100b]/75 dark:shadow-[0_20px_70px_rgba(0,0,0,0.45)]">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <Trophy className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                    Milestones
                  </p>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Full Achievement List
                  </h2>
                </div>
              </div>

              <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-gray-800 dark:bg-black/30 dark:text-gray-400">
                {achievements.length} achievements
              </span>
            </div>

            {achievements.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {achievements.map((ach) => (
                  <div
                    key={ach._id}
                    className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
                      ach.unlocked
                        ? "border-emerald-200/80 bg-gradient-to-br from-white/80 to-emerald-50/60 shadow-sm hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-black/30 dark:hover:border-emerald-700/60"
                        : "border-slate-200/80 bg-slate-50/60 hover:border-slate-300 dark:border-gray-800 dark:bg-black/20 dark:hover:border-gray-700"
                    }`}
                  >
                    {ach.unlocked && (
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                    )}

                    <div className="flex items-start gap-4">
                      <div
                        className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border ${
                          ach.unlocked
                            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/50"
                            : "border-slate-200 bg-slate-100 grayscale dark:border-gray-800 dark:bg-gray-900"
                        }`}
                      >
                        <img
                          src={ach.icon || "/default-badge.png"}
                          alt={ach.name}
                          className="h-full w-full object-cover"
                        />

                        {!ach.unlocked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/60 dark:bg-black/40">
                            <LockKeyhole className="h-5 w-5 text-slate-500 dark:text-gray-500" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={`text-sm font-bold ${
                              ach.unlocked
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-600 dark:text-gray-400"
                            }`}
                          >
                            {ach.name}
                          </h3>

                          {ach.unlocked && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          )}
                        </div>

                        <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-gray-500">
                          {ach.description}
                        </p>

                        <div className="mt-3">
                          {ach.unlocked ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Unlocked •{" "}
                              {new Date(ach.unlockedAt).toLocaleDateString(
                                "en-AU"
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500">
                              <LockKeyhole className="h-3 w-3" />
                              Locked
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center dark:border-gray-800 dark:bg-black/20">
                <Trophy className="mx-auto h-8 w-8 text-slate-400 dark:text-gray-600" />
                <p className="mt-3 text-sm font-medium text-slate-500 dark:text-gray-400">
                  No achievements available yet.
                </p>
              </div>
            )}
          </section>
        </div>

        {isDev && (
          <section className="mt-5 overflow-hidden rounded-3xl border border-amber-200/80 bg-white/70 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-amber-900/30 dark:bg-[#0d0b05]/75 dark:shadow-[0_20px_70px_rgba(0,0,0,0.45)]">
            <div className="border-b border-amber-200/70 bg-amber-50/60 px-5 py-4 dark:border-amber-900/30 dark:bg-amber-950/20 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-400">
                  <Settings2 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                    Development Mode
                  </p>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Testing Controls
                  </h2>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-3 sm:p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-gray-800 dark:bg-black/20">
                <div className="mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Add to Counter
                  </h3>
                </div>

                <select
                  value={selectedCounter}
                  onChange={(e) => setSelectedCounter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:focus:border-emerald-700"
                >
                  <option value="">Select a Counter</option>

                  {userStats &&
                    Object.keys(userStats.counters).map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                </select>

                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    value={counterValue}
                    onChange={(e) =>
                      setCounterValue(Number(e.target.value))
                    }
                    placeholder="Enter value"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:placeholder:text-gray-600 dark:focus:border-emerald-700"
                  />

                  <Button
                    type="button"
                    onClick={handleAddToCounter}
                    size="tiny"
                    disabled={!selectedCounter || counterValue <= 0}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-gray-800 dark:bg-black/20">
                <div className="mb-4 flex items-center gap-2">
                  <Flag className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Set Flag
                  </h3>
                </div>

                <select
                  value={selectedFlag}
                  onChange={(e) => setSelectedFlag(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:focus:border-emerald-700"
                >
                  <option value="">Select a Flag</option>

                  {userStats &&
                    Object.keys(userStats.flags).map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                </select>

                <div className="mt-3">
                  <Button
                    type="button"
                    onClick={handleSetFlagTrue}
                    size="tiny"
                    disabled={!selectedFlag}
                  >
                    Set True
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-gray-800 dark:bg-black/20">
                <div className="mb-4 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Reset Controls
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="transparent"
                    size="tiny"
                    onClick={handleResetFlags}
                  >
                    Reset Flags
                  </Button>

                  <Button
                    type="button"
                    variant="transparent"
                    size="tiny"
                    onClick={handleResetCounters}
                  >
                    Reset Counters
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    size="tiny"
                    onClick={handleResetAll}
                  >
                    Reset All
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <ChatBubble />
    </div>
  );
}

export default Achievements;