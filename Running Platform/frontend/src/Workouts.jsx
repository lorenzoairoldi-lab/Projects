import React, { useState, useEffect } from "react";
import { getWorkouts, createWorkout, updateWorkout, deleteWorkout } from "./api";
import { useToast } from "./Toast";

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
        addToast("Workout updated!");
      } else {
        await createWorkout(payload);
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
      addToast("Workout deleted");
      load(page);
    } catch {
      addToast("Failed to delete workout", "error");
    }
  };

  const totalPages = Math.ceil(total / 20);

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm bg-white";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🏃 My Workouts</h2>
        <button
          onClick={() => {
            if (!showForm) resetForm();
            setShowForm(!showForm);
          }}
          className={`px-5 py-2.5 rounded-lg font-medium text-sm transition cursor-pointer ${
            showForm
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-primary hover:bg-primary-dark text-white shadow-sm"
          }`}
        >
          {showForm ? "Cancel" : "+ New Workout"}
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          {editingId && (
            <div className="mb-4 text-sm text-primary font-medium flex items-center gap-2">
              <span>✏️</span> Editing workout
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Distance (km)</label>
              <input
                type="number" step="0.01" placeholder="e.g. 10"
                value={form.distanceKm}
                onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Duration (min)</label>
              <input
                type="number" placeholder="e.g. 50"
                value={form.durationMin}
                onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Elevation (m)</label>
              <input
                type="number" placeholder="e.g. 120"
                value={form.elevationM}
                onChange={(e) => setForm({ ...form, elevationM: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <input
                placeholder="e.g. Morning run"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-accent hover:bg-accent/80 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition cursor-pointer"
            >
              {saving ? "Saving..." : editingId ? "Update Workout" : "Save Workout"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg text-sm transition cursor-pointer"
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
            <div className="text-gray-400 text-sm animate-pulse">Loading workouts...</div>
          </div>
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-gray-500 text-lg">No workouts yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first one!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-dark text-white">
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
                  <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {new Date(w.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {parseFloat(w.distance_km).toFixed(2)} km
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {w.duration_min} min
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {w.pace_min_per_km
                        ? `${parseFloat(w.pace_min_per_km).toFixed(2)} min/km`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {w.elevation_m > 0 ? `${w.elevation_m}m` : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">
                      {w.notes || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => startEdit(w)}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(w.id)}
                          className="bg-danger/10 text-danger hover:bg-danger hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
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
            <div className="flex items-center justify-center gap-3 px-4 py-4 border-t border-gray-100">
              <button
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  page <= 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-dark"
                }`}
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600">
                Page <strong>{page}</strong> of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => load(page + 1)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  page >= totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
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
