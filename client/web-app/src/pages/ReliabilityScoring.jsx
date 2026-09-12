import React, { useCallback, useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import {
  analyzeReliabilitySentiment,
  getReliabilityHealth,
  getReliabilityStations,
  getReliabilitySuburbs,
  getReliabilitySummary,
  getReliabilityTop,
  scoreReliabilityStation,
} from "../services/reliabilityScoringService";

const SENTIMENT_OPTIONS = ["All", "Positive", "Neutral", "Negative"];
const STATUS_OPTIONS = ["Operational", "Online", "Needs Maintenance", "Unknown"];

const getToken = () => {
  try {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user).token : null;
  } catch {
    return null;
  }
};

const formatNumber = (value, digits = 1) =>
  value == null || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toFixed(digits);

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm
      transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`}
  >
    {children}
  </div>
);

const Label = ({ children }) => (
  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
    {children}
  </label>
);

const Input = (props) => (
  <input
    {...props}
    className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5
      text-sm text-slate-800 outline-none transition
      placeholder:text-slate-400
      hover:border-slate-300
      focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100
      ${props.className || ""}`}
  />
);

const Select = (props) => (
  <select
    {...props}
    className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5
      text-sm text-slate-800 outline-none transition
      hover:border-slate-300
      focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100
      ${props.className || ""}`}
  />
);

const SentimentBadge = ({ label }) => {
  if (!label) return <span className="text-slate-400">—</span>;

  const styles = {
    positive: "bg-emerald-50 text-emerald-700 border-emerald-200",
    negative: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const key = String(label).toLowerCase();

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styles[key] || styles.neutral
      }`}
    >
      {label}
    </span>
  );
};

export default function ReliabilityScoring() {
  const [token] = useState(getToken);

  const [health, setHealth] = useState(null);
  const [suburbs, setSuburbs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [stations, setStations] = useState([]);
  const [stationsTotal, setStationsTotal] = useState(0);

  const [topPositive, setTopPositive] = useState([]);
  const [topNegative, setTopNegative] = useState([]);
  const [topReliable, setTopReliable] = useState([]);

  const [suburb, setSuburb] = useState("All");
  const [sentiment, setSentiment] = useState("All");
  const [minScore, setMinScore] = useState("");

  const [scoreName, setScoreName] = useState("");
  const [scoreStatus, setScoreStatus] = useState("Operational");
  const [scorePower, setScorePower] = useState(150);
  const [scoreMaxPower, setScoreMaxPower] = useState(350);
  const [scoreResult, setScoreResult] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  const [feedbackText, setFeedbackText] =
    useState("Fantastic experience! Smooth and quick charging.");
  const [sentimentResult, setSentimentResult] = useState(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);

  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getReliabilityHealth()
      .then(setHealth)
      .catch(() =>
        setHealth({
          status: "down",
          data_loaded: false,
          station_count: 0,
        })
      );
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!token) {
      setError("Please sign in to load reliability data.");
      return;
    }

    setLoadingData(true);
    setError("");

    const suburbValue = suburb === "All" ? undefined : suburb;
    const sentimentValue = sentiment === "All" ? undefined : sentiment;

    const filterParams = {
      suburb: suburbValue,
      sentiment: sentimentValue,
      min_score: minScore === "" ? undefined : Number(minScore),
      limit: 40,
      offset: 0,
    };

    try {
      const [suburbRes, summaryRes, stationsRes, pos, neg, reliable] =
        await Promise.all([
          getReliabilitySuburbs(token),
          getReliabilitySummary(token, { suburb: suburbValue }),
          getReliabilityStations(token, filterParams),
          getReliabilityTop(token, {
            kind: "positive",
            limit: 5,
            suburb: suburbValue,
          }),
          getReliabilityTop(token, {
            kind: "negative",
            limit: 5,
            suburb: suburbValue,
          }),
          getReliabilityTop(token, {
            kind: "reliability",
            limit: 5,
            suburb: suburbValue,
          }),
        ]);

      setSuburbs(suburbRes.suburbs || []);
      setSummary(summaryRes);
      setStations(stationsRes.stations || []);
      setStationsTotal(stationsRes.total || 0);
      setTopPositive(pos.stations || []);
      setTopNegative(neg.stations || []);
      setTopReliable(reliable.stations || []);
    } catch (err) {
      setError(err?.message || "Failed to load reliability data");
    } finally {
      setLoadingData(false);
    }
  }, [token, suburb, sentiment, minScore]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleScore = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Please sign in to score a station.");
      return;
    }

    setScoreLoading(true);
    setScoreResult(null);
    setError("");

    try {
      const result = await scoreReliabilityStation(token, {
        name: scoreName || undefined,
        status: scoreStatus,
        power_kw: Number(scorePower),
        max_power_kw: Number(scoreMaxPower),
      });

      setScoreResult(result);
    } catch (err) {
      setError(err?.message || "Scoring failed");
    } finally {
      setScoreLoading(false);
    }
  };

  const handleSentiment = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Please sign in to analyse sentiment.");
      return;
    }

    setSentimentLoading(true);
    setSentimentResult(null);
    setError("");

    try {
      const result = await analyzeReliabilitySentiment(token, feedbackText);
      setSentimentResult(result);
    } catch (err) {
      setError(err?.message || "Sentiment analysis failed");
    } finally {
      setSentimentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold tracking-wide text-emerald-700">
            USE CASE
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Charger Reliability{" "}
            <span className="text-emerald-600">Scoring</span>
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Explore Melbourne station reliability, uptime, and user sentiment.
            Score any charger using the reliability formula.
          </p>

          {health && (
            <div
              className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                health.data_loaded
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              ML service: {health.status}
              {health.data_loaded
                ? ` · ${health.station_count} stations`
                : " · data not loaded"}
            </div>
          )}
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* KPI cards */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Stations", summary?.total_stations ?? "—"],
            [
              "Online %",
              summary ? `${formatNumber(summary.online_pct)}%` : "—",
            ],
            [
              "Avg Uptime",
              summary ? `${formatNumber(summary.avg_uptime)}%` : "—",
            ],
            [
              "Avg Reliability",
              summary ? formatNumber(summary.avg_reliability) : "—",
            ],
          ].map(([label, value]) => (
            <Card key={label} className="group">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 transition group-hover:text-emerald-600">
                {value}
              </p>
            </Card>
          ))}
        </section>

        {/* Filters + scoring */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-xl font-bold text-slate-900">
              Explore stations
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Filter Melbourne chargers by suburb, sentiment and reliability.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Suburb</Label>
                <Select
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                >
                  <option value="All">All</option>
                  {suburbs.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Sentiment</Label>
                <Select
                  value={sentiment}
                  onChange={(e) => setSentiment(e.target.value)}
                >
                  {SENTIMENT_OPTIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Minimum score</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 70"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={loadDashboard}
                  disabled={loadingData}
                  className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingData ? "Refreshing…" : "Refresh data"}
                </button>
              </div>
            </div>

            {summary?.sentiment_counts && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">
                  Sentiment:
                </span>{" "}
                Positive {summary.sentiment_counts.Positive ?? 0} · Neutral{" "}
                {summary.sentiment_counts.Neutral ?? 0} · Negative{" "}
                {summary.sentiment_counts.Negative ?? 0}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-bold text-slate-900">
              Score a station
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Calculate reliability using station status and charging power.
            </p>

            <form onSubmit={handleScore} className="mt-6 space-y-4">
              <div>
                <Label>Name (optional)</Label>
                <Input
                  value={scoreName}
                  onChange={(e) => setScoreName(e.target.value)}
                  placeholder="e.g. South Melbourne Charger"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={scoreStatus}
                    onChange={(e) => setScoreStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Power (kW)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={scorePower}
                    onChange={(e) => setScorePower(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Max power (kW)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={scoreMaxPower}
                    onChange={(e) => setScoreMaxPower(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={scoreLoading}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {scoreLoading ? "Scoring…" : "Compute reliability →"}
              </button>
            </form>

            {scoreResult && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Reliability score
                </p>

                <p className="mt-1 text-4xl font-bold text-emerald-700">
                  {formatNumber(scoreResult.reliability_score, 2)}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-white p-3">
                    <p className="text-xs font-semibold text-slate-500">
                      Breakdown
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Status {formatNumber(scoreResult.status_score, 0)} ·
                      Power {formatNumber(scoreResult.power_score, 2)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-3">
                    <p className="text-xs font-semibold text-slate-500">
                      Formula
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {scoreResult.formula}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSentiment} className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="text-lg font-bold text-slate-900">
                Analyse feedback
              </h3>

              <div className="mt-4">
                <Label>User feedback</Label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <button
                type="submit"
                disabled={sentimentLoading}
                className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
              >
                {sentimentLoading ? "Analysing…" : "Analyse sentiment"}
              </button>

              {sentimentResult && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <SentimentBadge label={sentimentResult.sentiment_label} />
                  <span className="text-sm font-semibold text-slate-700">
                    Compound{" "}
                    {formatNumber(sentimentResult.sentiment_score, 2)}
                  </span>
                </div>
              )}
            </form>
          </Card>
        </section>

        {/* Station table */}
        <Card className="mt-6 overflow-hidden p-0">
          <div className="border-b border-slate-100 px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Station list
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Showing {stations.length} of {stationsTotal} stations
                </p>
              </div>
            </div>
          </div>

          {loadingData ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              Loading stations…
            </div>
          ) : stations.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              No stations match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {[
                      "Station",
                      "Suburb",
                      "Status",
                      "Reliability",
                      "Uptime",
                      "Rating",
                      "Sentiment",
                      "Feedback",
                    ].map((head) => (
                      <th key={head} className="px-5 py-3 font-semibold">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {stations.map((station) => (
                    <tr
                      key={station.charger_id || station.charger_name}
                      className="transition hover:bg-emerald-50/40"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {station.charger_name || "Unknown"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {station.charger_id}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {station.suburb || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {station.status || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-bold text-emerald-600">
                          {formatNumber(station.reliability_score, 1)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {station.uptime_pct != null
                          ? `${formatNumber(station.uptime_pct)}%`
                          : "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatNumber(station.rating, 1)}
                      </td>

                      <td className="px-5 py-4">
                        <SentimentBadge label={station.sentiment_label} />
                      </td>

                      <td className="max-w-xs px-5 py-4 text-slate-500">
                        <p className="truncate">
                          {station.user_feedback
                            ? station.user_feedback.slice(0, 90) +
                              (station.user_feedback.length > 90 ? "…" : "")
                            : "—"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Top stations */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Top positive",
              data: topPositive,
              empty: "No positive stations in scope.",
              render: (s) =>
                `${s.suburb} · score ${formatNumber(
                  s.reliability_score
                )} · rating ${formatNumber(s.rating)}`,
            },
            {
              title: "Top negative",
              data: topNegative,
              empty: "No negative stations in scope.",
              render: (s) =>
                `${s.suburb} · score ${formatNumber(
                  s.reliability_score
                )} · sentiment ${formatNumber(s.sentiment_score, 2)}`,
            },
            {
              title: "Most reliable",
              data: topReliable,
              empty: "No stations in scope.",
              render: (s) =>
                `${s.suburb} · score ${formatNumber(
                  s.reliability_score
                )} · uptime ${
                  s.uptime_pct != null
                    ? `${formatNumber(s.uptime_pct)}%`
                    : "—"
                }`,
            },
          ].map((group) => (
            <Card key={group.title}>
              <h2 className="text-lg font-bold text-slate-900">
                {group.title}
              </h2>

              {group.data.length === 0 ? (
                <p className="mt-5 text-sm text-slate-400">{group.empty}</p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {group.data.map((s) => (
                    <li
                      key={`${group.title}-${s.charger_id}`}
                      className="py-3 transition hover:px-2"
                    >
                      <p className="font-semibold text-slate-800">
                        {s.charger_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {group.render(s)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}