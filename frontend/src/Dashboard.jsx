import React, { useState, useEffect } from "react";
import { getWeeklyStats, getMonthlyStats, getPersonalBests, getProgress } from "./api";

export default function Dashboard() {
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [bests, setBests] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getWeeklyStats(4),
      getMonthlyStats(3),
      getPersonalBests(),
      getProgress("distance", "monthly"),
    ]).then(([w, m, b, p]) => {
      setWeekly(w.weeks);
      setMonthly(m.months);
      setBests(b.bests);
      setProgress(p);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ textAlign: "center", marginTop: 50, fontSize: 18 }}>Loading dashboard...</p>;

  const metricLabels = {
    longest_run: "🏆 Longest Run",
    fastest_5k: "⚡ Fastest 5k Pace",
    fastest_10k: "⚡ Fastest 10k Pace",
    most_elevation: "⛰️ Most Elevation",
  };

  const maxWeekly = Math.max(...weekly.map((w) => parseFloat(w.total_distance_km)), 1);

  return (
    <div>
      <h2>📊 Dashboard</h2>

      {/* Progress */}
      {progress && (
        <div style={cardStyle}>
          <h3 style={{ margin: 0 }}>Progress (this month vs last)</h3>
          <p style={{ fontSize: 24, fontWeight: "bold", margin: "8px 0" }}>
            {parseFloat(progress.current).toFixed(1)} km
            <span style={{ fontSize: 16, fontWeight: "normal", color: progress.change >= 0 ? "green" : "red", marginLeft: 10 }}>
              ({progress.change >= 0 ? "+" : ""}{progress.change.toFixed(1)} km, {progress.percentage ?? 0}%)
            </span>
          </p>
        </div>
      )}

      {/* Weekly Chart */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 12px" }}>Last 4 Weeks</h3>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 150 }}>
          {weekly.map((w) => {
            const km = parseFloat(w.total_distance_km);
            const pct = (km / maxWeekly) * 100;
            return (
              <div key={w.week_start} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ background: "#1a1a2e", height: `${Math.max(pct, 2)}%`, borderRadius: "6px 6px 0 0", minHeight: 4 }} />
                <div style={{ fontSize: 11, marginTop: 4 }}>{km.toFixed(1)} km</div>
                <div style={{ fontSize: 10, color: "#666" }}>{new Date(w.week_start).toLocaleDateString("en", { month: "short", day: "numeric" })}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Stats */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 12px" }}>Monthly Totals</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1a1a2e", color: "#fff" }}>
              <th style={thStyle}>Month</th>
              <th style={thStyle}>Distance</th>
              <th style={thStyle}>Duration</th>
              <th style={thStyle}>Workouts</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((m) => (
              <tr key={m.month_start} style={{ borderBottom: "1px solid #eee" }}>
                <td style={tdStyle}>{new Date(m.month_start + "-01").toLocaleDateString("en", { month: "long", year: "numeric" })}</td>
                <td style={tdStyle}>{parseFloat(m.total_distance_km).toFixed(1)} km</td>
                <td style={tdStyle}>{m.total_duration_min} min</td>
                <td style={tdStyle}>{m.workout_count}</td>
              </tr>
            ))}
            {monthly.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: 20, color: "#666" }}>No data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Personal Bests */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 12px" }}>🏆 Personal Bests</h3>
        {bests.length === 0 ? (
          <p style={{ color: "#666" }}>Keep running to set your first records!</p>
        ) : (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
            {bests.map((b) => (
              <div key={b.metric} style={{ background: "#f5f5f5", padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: 13, color: "#666" }}>{metricLabels[b.metric] || b.metric}</div>
                <div style={{ fontSize: 20, fontWeight: "bold", marginTop: 4 }}>
                  {b.metric.includes("pace") ? `${parseFloat(b.value).toFixed(2)} min/km` :
                   b.metric === "most_elevation" ? `${b.value}m` :
                   `${parseFloat(b.value).toFixed(2)} km`}
                </div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{new Date(b.achieved_date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle = { background: "#fff", borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" };
const thStyle = { padding: 10, textAlign: "left", fontSize: 13 };
const tdStyle = { padding: 10, fontSize: 14 };
