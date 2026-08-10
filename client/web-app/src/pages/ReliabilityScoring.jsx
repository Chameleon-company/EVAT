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
import "../styles/Root.css";
import "../styles/Buttons.css";
import "../styles/Elements.css";
import "../styles/Fonts.css";
import "../styles/Forms.css";
import "../styles/NavBar.css";
import "../styles/Validation.css";
import "../styles/ReliabilityScoring.css";

const SENTIMENT_OPTIONS = ["All", "Positive", "Neutral", "Negative"];
const STATUS_OPTIONS = ["Operational", "Online", "Needs Maintenance", "Unknown"];

function getToken() {
  const tokenFull = localStorage.getItem("currentUser");
  return tokenFull ? JSON.parse(tokenFull).token : null;
}

function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(digits);
}

function SentimentBadge({ label }) {
  if (!label) return <span className="rs-meta">—</span>;
  const key = String(label).toLowerCase();
  return (
    <span className={`rs-sentiment rs-sentiment--${key}`}>
      {label}
    </span>
  );
}

export default function ReliabilityScoring() {
  const [token] = useState(() => getToken());

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

  const [feedbackText, setFeedbackText] = useState("Fantastic experience! Smooth and quick charging.");
  const [sentimentResult, setSentimentResult] = useState(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);

  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getReliabilityHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: "down", data_loaded: false, station_count: 0 }));
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!token) {
      setError("Please sign in to load reliability data.");
      return;
    }

    setLoadingData(true);
    setError("");

    const filterParams = {
      suburb: suburb === "All" ? undefined : suburb,
      sentiment: sentiment === "All" ? undefined : sentiment,
      min_score: minScore === "" ? undefined : Number(minScore),
      limit: 40,
      offset: 0,
    };

    const summaryParams = {
      suburb: suburb === "All" ? undefined : suburb,
    };

    try {
      const [suburbRes, summaryRes, stationsRes, pos, neg, reliable] =
        await Promise.all([
          getReliabilitySuburbs(token),
          getReliabilitySummary(token, summaryParams),
          getReliabilityStations(token, filterParams),
          getReliabilityTop(token, {
            kind: "positive",
            limit: 5,
            suburb: suburb === "All" ? undefined : suburb,
          }),
          getReliabilityTop(token, {
            kind: "negative",
            limit: 5,
            suburb: suburb === "All" ? undefined : suburb,
          }),
          getReliabilityTop(token, {
            kind: "reliability",
            limit: 5,
            suburb: suburb === "All" ? undefined : suburb,
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
      setError(err.message || "Failed to load reliability data");
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
      setError(err.message || "Scoring failed");
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
      setError(err.message || "Sentiment analysis failed");
    } finally {
      setSentimentLoading(false);
    }
  };

  return (
    <div className="reliability-scoring-page">
      <NavBar />
      <div className="background-image" />

      <div className="rs-container">
        <div className="rs-header">
          <div className="rs-badge">USE CASE</div>
          <h1 className="rs-title">Charger Reliability Scoring</h1>
          <p className="rs-subtitle">
            Explore Melbourne station reliability, uptime, and user sentiment.
            Score any charger with the notebook formula: status × 0.6 + power × 0.4.
          </p>
          {health && (
            <p
              className={`rs-health ${
                health.data_loaded ? "rs-health--ok" : "rs-health--down"
              }`}
            >
              ML service: {health.status}
              {health.data_loaded
                ? ` · data loaded (${health.station_count} stations)`
                : " · data not loaded — start with npm run dev:reliability"}
            </p>
          )}
        </div>

        {error && <p className="rs-error" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="rs-kpis">
          <div className="rs-kpi">
            <div className="rs-kpi-label">Stations</div>
            <div className="rs-kpi-value">{summary?.total_stations ?? "—"}</div>
          </div>
          <div className="rs-kpi">
            <div className="rs-kpi-label">Online %</div>
            <div className="rs-kpi-value">
              {summary ? `${formatNumber(summary.online_pct)}%` : "—"}
            </div>
          </div>
          <div className="rs-kpi">
            <div className="rs-kpi-label">Avg Uptime</div>
            <div className="rs-kpi-value">
              {summary ? `${formatNumber(summary.avg_uptime)}%` : "—"}
            </div>
          </div>
          <div className="rs-kpi">
            <div className="rs-kpi-label">Avg Reliability</div>
            <div className="rs-kpi-value">
              {summary ? formatNumber(summary.avg_reliability) : "—"}
            </div>
          </div>
        </div>

        <div className="rs-layout">
          <div className="rs-panel">
            <h2 className="rs-panel-title">Explore stations</h2>
            <p className="rs-section-note">
              Filter Melbourne chargers by suburb, sentiment, and minimum reliability score.
            </p>

            <div className="rs-fields">
              <div className="rs-field">
                <label className="rs-label">Suburb</label>
                <select
                  className="input rs-input"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                >
                  <option value="All">All</option>
                  {suburbs.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="rs-field">
                <label className="rs-label">Sentiment</label>
                <select
                  className="input rs-input"
                  value={sentiment}
                  onChange={(e) => setSentiment(e.target.value)}
                >
                  {SENTIMENT_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="rs-field">
                <label className="rs-label">Min score</label>
                <input
                  className="input rs-input"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 70"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                />
              </div>

              <div className="rs-field" style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  type="button"
                  className="rs-secondary"
                  style={{ width: "100%" }}
                  onClick={loadDashboard}
                  disabled={loadingData}
                >
                  {loadingData ? "Refreshing…" : "Refresh"}
                </button>
              </div>
            </div>

            {summary?.sentiment_counts && (
              <div className="rs-cards" style={{ marginTop: 16 }}>
                <div className="rs-card rs-card--muted">
                  <div className="rs-label">Sentiment in scope</div>
                  <div className="rs-meta">
                    Positive {summary.sentiment_counts.Positive ?? 0}
                    {" · "}Neutral {summary.sentiment_counts.Neutral ?? 0}
                    {" · "}Negative {summary.sentiment_counts.Negative ?? 0}
                    {summary.last_refresh ? ` · refreshed ${summary.last_refresh}` : ""}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rs-panel">
            <h2 className="rs-panel-title">Score a station</h2>
            <p className="rs-section-note">
              Operational/Online = 100 status points. Power is normalized against max kW.
            </p>

            <form onSubmit={handleScore}>
              <div className="rs-fields">
                <div className="rs-field rs-field--full">
                  <label className="rs-label">Name (optional)</label>
                  <input
                    className="input rs-input"
                    type="text"
                    value={scoreName}
                    onChange={(e) => setScoreName(e.target.value)}
                    placeholder="e.g. Tesla Supercharger South Melbourne"
                  />
                </div>

                <div className="rs-field">
                  <label className="rs-label">Status</label>
                  <select
                    className="input rs-input"
                    value={scoreStatus}
                    onChange={(e) => setScoreStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="rs-field">
                  <label className="rs-label">Power (kW)</label>
                  <input
                    className="input rs-input"
                    type="number"
                    min={0}
                    step="1"
                    value={scorePower}
                    onChange={(e) => setScorePower(e.target.value)}
                    required
                  />
                </div>

                <div className="rs-field">
                  <label className="rs-label">Max power (kW)</label>
                  <input
                    className="input rs-input"
                    type="number"
                    min={0}
                    step="1"
                    value={scoreMaxPower}
                    onChange={(e) => setScoreMaxPower(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="rs-actions">
                <button type="submit" className="rs-submit" disabled={scoreLoading}>
                  {scoreLoading ? "Scoring…" : "Compute reliability"}
                </button>
              </div>
            </form>

            {scoreResult && (
              <div className="rs-score-block">
                <div className="rs-label">Reliability score</div>
                <div className="rs-score-value">
                  {formatNumber(scoreResult.reliability_score, 2)}
                </div>
                <div className="rs-cards">
                  <div className="rs-card rs-card--ok">
                    <div className="rs-label">Breakdown</div>
                    <div className="rs-meta">
                      Status score {formatNumber(scoreResult.status_score, 0)} · Power score{" "}
                      {formatNumber(scoreResult.power_score, 2)}
                    </div>
                  </div>
                  <div className="rs-card rs-card--muted">
                    <div className="rs-label">Formula</div>
                    <div className="rs-meta">{scoreResult.formula}</div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSentiment} style={{ marginTop: 24 }}>
              <h2 className="rs-panel-title">Analyse feedback sentiment</h2>
              <div className="rs-field rs-field--full">
                <label className="rs-label">User feedback</label>
                <textarea
                  className="input rs-input"
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
              </div>
              <button type="submit" className="rs-secondary" disabled={sentimentLoading}>
                {sentimentLoading ? "Analysing…" : "Analyse sentiment"}
              </button>
              {sentimentResult && (
                <div className="rs-cards" style={{ marginTop: 12 }}>
                  <div className="rs-card">
                    <SentimentBadge label={sentimentResult.sentiment_label} />
                    <div className="rs-card-value" style={{ marginTop: 8 }}>
                      Compound {formatNumber(sentimentResult.sentiment_score, 4)}
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="rs-panel">
          <h2 className="rs-panel-title">
            Station list
            <span className="rs-meta" style={{ marginLeft: 10, textTransform: "none" }}>
              showing {stations.length} of {stationsTotal}
            </span>
          </h2>

          {loadingData && <p className="rs-placeholder">Loading stations…</p>}

          {!loadingData && stations.length === 0 && (
            <p className="rs-empty">No stations match the current filters.</p>
          )}

          {!loadingData && stations.length > 0 && (
            <div className="rs-table-wrap">
              <table className="rs-table">
                <thead>
                  <tr>
                    <th>Station</th>
                    <th>Suburb</th>
                    <th>Status</th>
                    <th>Reliability</th>
                    <th>Uptime</th>
                    <th>Rating</th>
                    <th>Sentiment</th>
                    <th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((station) => (
                    <tr key={station.charger_id || station.charger_name}>
                      <td>
                        <span className="rs-station-name">
                          {station.charger_name || "Unknown"}
                        </span>
                        <span className="rs-station-id">{station.charger_id}</span>
                      </td>
                      <td>{station.suburb || "—"}</td>
                      <td>{station.status || "—"}</td>
                      <td>{formatNumber(station.reliability_score, 1)}</td>
                      <td>
                        {station.uptime_pct != null
                          ? `${formatNumber(station.uptime_pct)}%`
                          : "—"}
                      </td>
                      <td>{formatNumber(station.rating, 1)}</td>
                      <td>
                        <SentimentBadge label={station.sentiment_label} />
                      </td>
                      <td>
                        <div className="rs-feedback">
                          {station.user_feedback
                            ? station.user_feedback.slice(0, 90) +
                              (station.user_feedback.length > 90 ? "…" : "")
                            : "—"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rs-top-grid">
          <div className="rs-top-card">
            <h2 className="rs-panel-title">Top positive</h2>
            {topPositive.length === 0 ? (
              <p className="rs-empty">No positive stations in scope.</p>
            ) : (
              <ul className="rs-top-list">
                {topPositive.map((s) => (
                  <li key={`pos-${s.charger_id}`} className="rs-top-item">
                    <div className="rs-top-name">{s.charger_name}</div>
                    <div className="rs-top-meta">
                      {s.suburb} · score {formatNumber(s.reliability_score, 1)} · rating{" "}
                      {formatNumber(s.rating, 1)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rs-top-card">
            <h2 className="rs-panel-title">Top negative</h2>
            {topNegative.length === 0 ? (
              <p className="rs-empty">No negative stations in scope.</p>
            ) : (
              <ul className="rs-top-list">
                {topNegative.map((s) => (
                  <li key={`neg-${s.charger_id}`} className="rs-top-item">
                    <div className="rs-top-name">{s.charger_name}</div>
                    <div className="rs-top-meta">
                      {s.suburb} · score {formatNumber(s.reliability_score, 1)} · sentiment{" "}
                      {formatNumber(s.sentiment_score, 2)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rs-top-card">
            <h2 className="rs-panel-title">Most reliable</h2>
            {topReliable.length === 0 ? (
              <p className="rs-empty">No stations in scope.</p>
            ) : (
              <ul className="rs-top-list">
                {topReliable.map((s) => (
                  <li key={`rel-${s.charger_id}`} className="rs-top-item">
                    <div className="rs-top-name">{s.charger_name}</div>
                    <div className="rs-top-meta">
                      {s.suburb} · score {formatNumber(s.reliability_score, 1)} · uptime{" "}
                      {s.uptime_pct != null ? `${formatNumber(s.uptime_pct)}%` : "—"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
