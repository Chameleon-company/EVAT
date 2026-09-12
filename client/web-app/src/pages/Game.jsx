import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import profileImage from "../assets/game-car.png";
import ChatBubble from "../components/ChatBubble";
import { Button } from '../components/Button';

function Game() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("currentUser"))
  );
  const [gameProfile, setGameProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  useEffect(() => {
    if (!user || !user.token) {
      navigate("/signin");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(
          "http://localhost:8080/api/gamification/profile",
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch gamification profile");
        }

        const data = await res.json();
        setGameProfile(data.data);
      } catch (err) {
        console.error("Error fetching gamification profile:", err);
        setError("Could not load game profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const refreshProfile = async () => {
    try {
      const res = await fetch(
        "http://localhost:8080/api/gamification/profile",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to refresh profile");
      }

      const profileData = await res.json();
      setGameProfile(profileData.data);
    } catch (err) {
      console.error("Profile refresh error:", err);
    }
  };

  const handleAppLogin = async () => {
    if (!user?.token) return;

    try {
      const oldBalance =
        gameProfile?.gamification_profile?.points_balance || 0;

      const res = await fetch(
        "http://localhost:8080/api/gamification/action",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            action_type: "app_login",
            session_id: `web-session-${Date.now()}`,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "App login failed");
      }

      const newBalance = result.data?.new_balance;
      const delta =
        newBalance !== undefined ? newBalance - oldBalance : null;

      if (delta !== null) {
        setLoginMessage(`App login successful! +${delta} points`);
      } else {
        setLoginMessage("App login successful!");
      }

      await refreshProfile();
    } catch (err) {
      console.error("App login error:", err);
      setLoginMessage(err.message || "App login failed.");
    }
  };

  const triggerGamificationAction = async (actionType) => {
    if (!user?.token) return;

    try {
      const oldBalance =
        gameProfile?.gamification_profile?.points_balance || 0;

      const res = await fetch(
        "http://localhost:8080/api/gamification/action",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            action_type: actionType,
            session_id: `web-session-${Date.now()}-${actionType}`,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Action failed");
      }

      const newBalance = result.data?.new_balance;
      const delta =
        newBalance !== undefined ? newBalance - oldBalance : null;

      if (delta !== null) {
        setLoginMessage(
          `Action "${actionType}" completed! +${delta} points`
        );
      } else {
        setLoginMessage(`Action "${actionType}" completed!`);
      }

      await refreshProfile();
    } catch (err) {
      console.error(`Action "${actionType}" failed:`, err);
      setLoginMessage(
        `Action "${actionType}" failed: ${err.message}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <NavBar />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-emerald-50/50 blur-3xl" />
      </div>

      {/* Main content */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        
        {/* Header */}
        <section className="mb-10 text-center">
          <span className="mb-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            EVAT Rewards
          </span>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Rewards
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Complete activities, earn points and build your EVAT engagement
            streak.
          </p>
        </section>

        {/* Main rewards layout */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Character card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
            <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Character
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your EVAT rewards companion
              </p>
            </div>

            <div className="flex min-h-[350px] items-center justify-center p-6">
              <img
                src={profileImage}
                className="h-auto max-h-72 w-full max-w-xs object-contain transition-transform duration-300 hover:scale-105"
                alt="Character"
              />
            </div>
          </div>

          {/* Actions + profile */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* Login check-in */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Daily Check-In
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Check in to earn points and maintain your streak.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="unstyled"
                  onClick={handleAppLogin}
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  App Login Check-In
                </Button>
              </div>
            </div>

            {/* Action rewards */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Try Action-Based Rewards
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Complete useful EVAT activities to earn additional points.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() =>
                    triggerGamificationAction("check_in")
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm"
                >
                  ✓ Check-In
                </Button>

                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() =>
                    triggerGamificationAction("report_fault")
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm"
                >
                  ⚠ Fault Report
                </Button>

                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() =>
                    triggerGamificationAction("validate_ai_prediction")
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm"
                >
                  🤖 AI Validation
                </Button>

                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() =>
                    triggerGamificationAction(
                      "discover_new_station_in_black_spot"
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm"
                >
                  📍 Black Spot Discovery
                </Button>

                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() =>
                    triggerGamificationAction("use_route_planner")
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm"
                >
                  🗺 Route Plan
                </Button>

                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() =>
                    triggerGamificationAction("ask_chatbot_question")
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm"
                >
                  💬 Chatbot Question
                </Button>
              </div>
            </div>

            {/* Status messages */}
            {loginMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
                {loginMessage}
              </div>
            )}

            {/* Game profile */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Your Progress
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Track your current rewards and engagement.
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
                  <span className="ml-3 text-sm font-medium text-slate-500">
                    Loading game profile...
                  </span>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : gameProfile ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  
                  {/* Points */}
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 transition hover:border-emerald-200 hover:bg-emerald-50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                      Points
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {gameProfile.gamification_profile?.points_balance}
                    </p>
                  </div>

                  {/* Current streak */}
                  <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 transition hover:border-orange-200">
                    <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                      Current Streak
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {gameProfile.engagement_metrics?.current_app_login_streak}
                      <span className="ml-1 text-sm font-medium text-slate-500">
                        day(s)
                      </span>
                    </p>
                  </div>

                  {/* Longest streak */}
                  <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 transition hover:border-amber-200">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                      Longest Streak
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {gameProfile.engagement_metrics?.longest_app_login_streak}
                      <span className="ml-1 text-sm font-medium text-slate-500">
                        day(s)
                      </span>
                    </p>
                  </div>

                  {/* Last login */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Last Login
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {new Date(
                        gameProfile.engagement_metrics?.last_login_date
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No game profile data.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <ChatBubble />
    </div>
  );
}

export default Game;
