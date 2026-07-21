import React, { useState, useEffect } from "react";
import { getWorkouts, createWorkout, updateWorkout, deleteWorkout, ingestStats } from "./api";
import { useToast } from "./Toast";

function RunningMan({ className = "w-16 h-16" }) {
  return (
    <svg viewBox="0 0 80 80" className={`${className} text-primary`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <g className="runner-bounce">
        {/* Head */}
        <circle cx="28" cy="12" r="6" stroke="currentColor" strokeWidth="2.5" />
        {/* Torso */}
        <line x1="28" y1="18" x2="28" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

        {/* Arms — translate to shoulder (28,24) */}
        <g className="runner-arm-back" transform="translate(28, 24)">
          <line x1="0" y1="0" x2="-14" y2="-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </g>
        <g className="runner-arm-front" transform="translate(28, 24)">
          <line x1="0" y1="0" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Legs — translate to hip (28,40) */}
        <g className="runner-leg-back" transform="translate(28, 40)">
          <line x1="0" y1="0" x2="-12" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <g className="runner-leg-front" transform="translate(28, 40)">
          <line x1="0" y1="0" x2="16" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Motion lines */}
        <line x1="8" y1="36" x2="3" y2="36" className="runner-motion" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="44" x2="5" y2="44" className="runner-motion runner-motion-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="6" y1="52" x2="0" y2="52" className="runner-motion runner-motion-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: todayStr(),
    distanceKm: "",
    durationMin: "",
    elevationM: "",
    notes: "",
  });
  const addToast = useToast();

  const load = async (p) => {
    setLoading(true);
    try {
      const data = await getWorkouts(p);
      setWorkouts(data.workouts);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      addToast("Failed to load workouts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const resetForm = () => {
    setForm({ date: todayStr(), distanceKm: "", durationMin: "", elevationM: "", notes: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (w) => {
    setForm({
      date: w.date ? w.date.split("T")[0] : todayStr(),
      distanceKm: String(w.distance_km),
      durationMin: String(w.duration_min),
      elevationM: w.elevation_m > 0 ? String(w.elevation_m) : "",
      notes: w.notes || "",
    });
    setEditingId(w.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        distanceKm: parseFloat(form.distanceKm),
        durationMin: parseInt(form.durationMin),
        elevationM: parseInt(form.elevationM) || 0,
        notes: form.notes || null,
      };

      if (editingId) {
        await updateWorkout(editingId, payload);
        ingestStats("update", payload);
        addToast("Workout updated!");
      } else {
        await createWorkout(payload);
        ingestStats("create", payload);
        addToast("Workout created!");
      }

      resetForm();
      load(1);
    } catch {
      addToast(`Failed to ${editingId ? "update" : "create"} workout`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this workout?")) return;
    try {
      await deleteWorkout(id);
      ingestStats("delete", { id });
      addToast("Workout deleted");
      load(page);
    } catch {
      addToast("Failed to delete workout", "error");
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">🏃 My Workouts</h2>
        <button
          onClick={() => {
            if (!showForm) resetForm();
            setShowForm(!showForm);
          }}
          className={`px-5 py-2.5 rounded-lg font-medium text-sm transition cursor-pointer ${
            showForm
              ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
              : "bg-primary hover:bg-primary-dark text-white shadow-sm"
          }`}
        >
          {showForm ? "Cancel" : "+ New Workout"}
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card dark:bg-slate-800 dark:border-slate-700 p-6 mb-6 relative overflow-hidden">
          {/* Saving overlay */}
          {saving && (
            <div className="absolute inset-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center gap-3">
              <RunningMan className="w-20 h-20" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-primary font-semibold text-sm animate-pulse">
                  {editingId ? "Updating workout..." : "Saving workout..."}
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-xs">Almost there! 🎯</span>
              </div>
            </div>
          )}

          {editingId && (
            <div className="mb-4 text-sm text-primary font-medium flex items-center gap-2">
              <span>✏️</span> Editing workout
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                disabled={saving}
                className="input dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Distance (km)</label>
              <input
                type="number" step="0.01" placeholder="e.g. 10"
                value={form.distanceKm}
                onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                required
                disabled={saving}
                className="input dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Duration (min)</label>
              <input
                type="number" placeholder="e.g. 50"
                value={form.durationMin}
                onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
                required
                disabled={saving}
                className="input dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Elevation (m)</label>
              <input
                type="number" placeholder="e.g. 120"
                value={form.elevationM}
                onChange={(e) => setForm({ ...form, elevationM: e.target.value })}
                disabled={saving}
                className="input dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes</label>
              <input
                placeholder="e.g. Morning run"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={saving}
                className="input dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 disabled:opacity-50"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              type="submit"
              disabled={saving}
              className="btn px-6 py-2.5 bg-accent hover:bg-accent/80 disabled:opacity-50 text-white font-medium disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : editingId ? "Update Workout" : "Save Workout"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="btn px-6 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-slate-400 text-sm animate-pulse">Loading workouts...</div>
          </div>
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-16 card dark:bg-slate-800 dark:border-slate-700">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-slate-500 dark:text-slate-300 text-lg font-medium">No workouts yet</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Create your first one!</p>
        </div>
      ) : (
        <div className="card dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-primary to-primary-dark dark:from-slate-700 dark:to-slate-700 text-white">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Distance</th>
                  <th className="text-left px-4 py-3 font-medium">Duration</th>
                  <th className="text-left px-4 py-3 font-medium">Pace</th>
                  <th className="text-left px-4 py-3 font-medium">Elevation</th>
                  <th className="text-left px-4 py-3 font-medium">Notes</th>
                  <th className="text-left px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {workouts.map((w) => (
                  <tr key={w.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-primary/5 dark:hover:bg-primary/10 transition">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {new Date(w.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap dark:text-slate-200">
                      {parseFloat(w.distance_km).toFixed(2)} km
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {w.duration_min} min
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {w.pace_min_per_km
                        ? `${parseFloat(w.pace_min_per_km).toFixed(2)} min/km`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {w.elevation_m > 0 ? `${w.elevation_m}m` : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[160px] truncate">
                      {w.notes || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => startEdit(w)}
                          className="btn px-3 py-1.5 bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary hover:text-white text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(w.id)}
                          className="btn px-3 py-1.5 bg-danger/10 dark:bg-danger/20 text-danger hover:bg-danger hover:text-white text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 px-4 py-4 border-t border-slate-100 dark:border-slate-700">
              <button
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                className={`btn px-4 py-2 text-sm font-medium ${
                  page <= 1
                    ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-dark"
                }`}
              >
                ← Prev
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page <strong>{page}</strong> of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => load(page + 1)}
                className={`btn px-4 py-2 text-sm font-medium ${
                  page >= totalPages
                    ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-dark"
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
