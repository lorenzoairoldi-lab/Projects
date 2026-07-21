import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getWeeklyStats, getMonthlyStats, getPersonalBests, getProgress } from "./api";
import { useToast } from "./Toast";

export default function Dashboard() {
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [bests, setBests] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const addToast = useToast();

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
    }).catch(() => addToast("Failed to load dashboard", "error"))
    .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-lg animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  const metricLabels = {
    longest_run: "Longest Run",
    fastest_5k: "Fastest 5k Pace",
    fastest_10k: "Fastest 10k Pace",
    most_elevation: "Most Elevation",
  };

  const metricIcons = {
    longest_run: "🏆",
    fastest_5k: "⚡",
    fastest_10k: "⚡",
    most_elevation: "⛰️",
  };

  const chartData = [...weekly].reverse().map((w) => ({
    label: new Date(w.week_start).toLocaleDateString("en", { month: "short", day: "numeric" }),
    km: parseFloat(w.total_distance_km),
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">📊 Dashboard</h2>

      {/* Progress Card */}
      {progress && (
        <div className="card dark:bg-slate-800 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Progress (this month vs last)</h3>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-800 dark:text-white">
              {parseFloat(progress.current).toFixed(1)} km
            </span>
            <span className={`text-lg font-semibold ${progress.change >= 0 ? "text-accent" : "text-danger"}`}>
              {progress.change >= 0 ? "+" : ""}{progress.change.toFixed(1)} km
              <span className="text-sm ml-1">({progress.percentage ?? 0}%)</span>
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${progress.change >= 0 ? "bg-accent" : "bg-danger"}`}
              style={{ width: `${Math.min(Math.abs(progress.percentage || 0), 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Weekly Chart */}
      <div className="card dark:bg-slate-800 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Last 4 Weeks</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.08)", backgroundColor: "var(--tooltip-bg, #fff)" }}
                formatter={(value) => [`${value.toFixed(1)} km`, "Distance"]}
              />
              <Bar dataKey="km" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-400 dark:text-slate-500 text-center py-8">No data yet</p>
        )}
      </div>

      {/* Monthly Stats Table */}
      <div className="card dark:bg-slate-800 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Monthly Totals</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-primary to-primary-dark dark:from-slate-700 dark:to-slate-700 text-white">
                <th className="text-left px-4 py-3 font-medium">Month</th>
                <th className="text-left px-4 py-3 font-medium">Distance</th>
                <th className="text-left px-4 py-3 font-medium">Duration</th>
                <th className="text-left px-4 py-3 font-medium">Workouts</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={m.month_start} className="border-b border-slate-100 dark:border-slate-700 hover:bg-primary/5 dark:hover:bg-primary/10 transition">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {new Date(m.month_start + "-01").toLocaleDateString("en", { month: "long", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 font-medium dark:text-slate-200">{parseFloat(m.total_distance_km).toFixed(1)} km</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.total_duration_min} min</td>
                  <td className="px-4 py-3 dark:text-slate-300">{m.workout_count}</td>
                </tr>
              ))}
              {monthly.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400 dark:text-slate-500">No data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Personal Bests */}
      <div className="card dark:bg-slate-800 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">🏆 Personal Bests</h3>
        {bests.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-500 text-center py-8">Keep running to set your first records!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {bests.map((b) => {
              const displayValue = b.metric.includes("pace")
                ? `${parseFloat(b.value).toFixed(2)} min/km`
                : b.metric === "most_elevation"
                  ? `${b.value}m`
                  : `${parseFloat(b.value).toFixed(2)} km`;

              return (
                <div key={b.metric} className="bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 rounded-xl p-5 border border-primary/10 dark:border-primary/20">
                  <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>{metricIcons[b.metric] || "🎯"}</span>
                    {metricLabels[b.metric] || b.metric}
                  </div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{displayValue}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {new Date(b.achieved_date).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
