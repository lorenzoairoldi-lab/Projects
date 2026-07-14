import React, { useState, useEffect } from "react";
import { getWorkouts, createWorkout, deleteWorkout } from "./api";

export default function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ distanceKm: "", durationMin: "", elevationM: "", notes: "" });
  const [showForm, setShowForm] = useState(false);

  const load = async (p) => {
    const data = await getWorkouts(p);
    setWorkouts(data.workouts);
    setTotal(data.total);
    setPage(data.page);
  };

  useEffect(() => { load(1); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createWorkout({
      distanceKm: parseFloat(form.distanceKm),
      durationMin: parseInt(form.durationMin),
      elevationM: parseInt(form.elevationM) || 0,
      notes: form.notes || null,
    });
    setForm({ distanceKm: "", durationMin: "", elevationM: "", notes: "" });
    setShowForm(false);
    load(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this workout?")) {
      await deleteWorkout(id);
      load(page);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>🏃 My Workouts</h2>
        <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>
          {showForm ? "Cancel" : "+ New Workout"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: "#f5f5f5", padding: 20, borderRadius: 8, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input placeholder="Distance (km)" type="number" step="0.01" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} required style={inputStyle} />
            <input placeholder="Duration (min)" type="number" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} required style={inputStyle} />
            <input placeholder="Elevation (m)" type="number" value={form.elevationM} onChange={(e) => setForm({ ...form, elevationM: e.target.value })} style={inputStyle} />
            <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={inputStyle} />
          </div>
          <button type="submit" style={{ ...btnPrimary, marginTop: 12 }}>Save Workout</button>
        </form>
      )}

      {workouts.length === 0 ? (
        <p style={{ color: "#666", textAlign: "center", marginTop: 40 }}>No workouts yet. Create your first one! 🎯</p>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
            <thead>
              <tr style={{ background: "#1a1a2e", color: "#fff" }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Distance</th>
                <th style={thStyle}>Duration</th>
                <th style={thStyle}>Pace</th>
                <th style={thStyle}>Elevation</th>
                <th style={thStyle}>Notes</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {workouts.map((w) => (
                <tr key={w.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={tdStyle}>{new Date(w.date).toLocaleDateString()}</td>
                  <td style={tdStyle}>{parseFloat(w.distance_km).toFixed(2)} km</td>
                  <td style={tdStyle}>{w.duration_min} min</td>
                  <td style={tdStyle}>{w.pace_min_per_km ? `${parseFloat(w.pace_min_per_km).toFixed(2)} min/km` : "-"}</td>
                  <td style={tdStyle}>{w.elevation_m > 0 ? `${w.elevation_m}m` : "-"}</td>
                  <td style={tdStyle}>{w.notes || "-"}</td>
                  <td style={tdStyle}>
                    <button onClick={() => handleDelete(w.id)} style={{ background: "#e94560", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
              <button disabled={page <= 1} onClick={() => load(page - 1)} style={pageBtn(page <= 1)}>← Prev</button>
              <span style={{ padding: "6px 12px" }}>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => load(page + 1)} style={pageBtn(page >= totalPages)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const thStyle = { padding: 10, textAlign: "left", fontSize: 13 };
const tdStyle = { padding: 10, fontSize: 14 };
const inputStyle = { display: "block", width: "100%", padding: 10, fontSize: 14, borderRadius: 4, border: "1px solid #ccc", boxSizing: "border-box" };
const btnPrimary = { background: "#1a1a2e", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 4, cursor: "pointer", fontSize: 14 };
const pageBtn = (disabled) => ({ background: disabled ? "#ccc" : "#1a1a2e", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 4, cursor: disabled ? "default" : "pointer" });
