import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import profileImage from "../assets/game-car.png";
import ChatBubble from "../components/ChatBubble";
import { Banner } from '../components/Banner';
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
    <div className="min-h-screen bg-surface-50 text-surface-900">
      <NavBar />

      <main className="min-h-screen transition-colors dark:bg-transparent">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-96 w-160 -translate-x-1/2 rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-emerald-50/50 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
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
              EVAT Platform
            </span>

            <h1
              className="
                mt-4 text-3xl font-bold tracking-tight
                text-surface-900 sm:text-4xl
              "
            >
              Rewards
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-surface-500 sm:text-base dark:text-surface-700/75">
              Complete activities, earn points and build your EVAT engagement
              streak.
            </p>
          </section>

          {/* Main rewards layout */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Character card */}
            <div className="overflow-hidden rounded-2xl border border-surface-200 bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
              <div className="border-b border-surface-100 bg-linear-to-r from-emerald-50 to-background px-6 py-4 dark:from-emerald-950">
                <h2 className="text-lg font-semibold text-surface-900">
                  Character
                </h2>
                <p className="mt-1 text-sm text-surface-500">
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
              <div className="rounded-2xl border border-surface-200 bg-background p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-surface-900">
                      Daily Check-In
                    </h2>
                    <p className="mt-1 text-sm text-surface-500">
                      Check in to earn points and maintain your streak.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAppLogin}
                  >
                    App Login Check-In
                  </Button>
                </div>
              </div>

              {/* Action rewards */}
              <div className="rounded-2xl border border-surface-200 bg-background p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-surface-900">
                    Try Action-Based Rewards
                  </h2>
                  <p className="mt-1 text-sm text-surface-500">
                    Complete useful EVAT activities to earn additional points.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="transparent"
                    className="justify-start gap-x-4"
                    onClick={() =>
                      triggerGamificationAction("check_in")
                    }
                  >
                    <span className="inline-block w-2">✓</span>
                    Check-In
                  </Button>

                  <Button
                    type="button"
                    variant="transparent"
                    className="justify-start gap-x-4"
                    onClick={() =>
                      triggerGamificationAction("report_fault")
                    }
                  >
                    <span className="inline-block w-2">⚠</span>
                    Fault Report
                  </Button>

                  <Button
                    type="button"
                    variant="transparent"
                    className="justify-start gap-x-4"
                    onClick={() =>
                      triggerGamificationAction("validate_ai_prediction")
                    }
                  >
                    <span className="inline-block w-2">🤖</span>
                    AI Validation
                  </Button>

                  <Button
                    type="button"
                    variant="transparent"
                    className="justify-start gap-x-4"
                    onClick={() =>
                      triggerGamificationAction(
                        "discover_new_station_in_black_spot"
                      )
                    }
                  >
                    <span className="inline-block w-2">📍</span>
                    Black Spot Discovery
                  </Button>

                  <Button
                    type="button"
                    variant="transparent"
                    className="justify-start gap-x-4"
                    onClick={() =>
                      triggerGamificationAction("use_route_planner")
                    }
                  >
                    <span className="inline-block w-2">🗺</span>
                    Route Plan
                  </Button>

                  <Button
                    type="button"
                    variant="transparent"
                    className="justify-start gap-x-4"
                    onClick={() =>
                      triggerGamificationAction("ask_chatbot_question")
                    }
                  >
                    <span className="inline-block w-2">💬</span>
                    Chatbot Question
                  </Button>
                </div>
              </div>

              {/* Status messages */}
              {loginMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm dark:bg-emerald-950">
                  {loginMessage}
                </div>
              )}

              {/* Game profile */}
              <div className="rounded-2xl border border-surface-200 bg-background p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-surface-900">
                    Your Progress
                  </h2>
                  <p className="mt-1 text-sm text-surface-500">
                    Track your current rewards and engagement.
                  </p>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-200 border-t-emerald-500" />
                    <span className="ml-3 text-sm font-medium text-surface-500">
                      Loading game profile...
                    </span>
                  </div>
                ) : error ? (
                  <Banner type="error">
                    {error}
                  </Banner>
                ) : gameProfile ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    
                    {/* Points */}
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 transition hover:border-emerald-200 hover:bg-emerald-50">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                        Points
                      </p>
                      <p className="mt-2 text-2xl font-bold text-surface-900">
                        {gameProfile.gamification_profile?.points_balance}
                      </p>
                    </div>

                    {/* Current streak */}
                    <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 transition hover:border-orange-200">
                      <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                        Current Streak
                      </p>
                      <p className="mt-2 text-2xl font-bold text-surface-900">
                        {gameProfile.engagement_metrics?.current_app_login_streak}
                        <span className="ml-1 text-sm font-medium text-surface-500">
                          day(s)
                        </span>
                      </p>
                    </div>

                    {/* Longest streak */}
                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 transition hover:border-amber-200">
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                        Longest Streak
                      </p>
                      <p className="mt-2 text-2xl font-bold text-surface-900">
                        {gameProfile.engagement_metrics?.longest_app_login_streak}
                        <span className="ml-1 text-sm font-medium text-surface-500">
                          day(s)
                        </span>
                      </p>
                    </div>

                    {/* Last login */}
                    <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/50">
                      <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Last Login
                      </p>
                      <p className="mt-2 text-lg font-bold text-surface-900">
                        {new Date(
                          gameProfile.engagement_metrics?.last_login_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-surface-200 bg-surface-50 px-4 py-6 text-center text-sm text-surface-500">
                    No game profile data.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* <ChatBubble /> */}
    </div>
  );
}

export default Game;