import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { login, register, logout } from "./api";
import Workouts from "./Workouts";
import Dashboard from "./Dashboard";

function Login({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = isRegister ? await register(form.email, form.password, form.name) : await login(form.email, form.password);
      setUser(data.user);
      navigate("/workouts");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1>🏃 Running Platform</h1>
      <h2>{isRegister ? "Register" : "Login"}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        {isRegister && (
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
        )}
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={inputStyle} />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required style={inputStyle} />
        <button type="submit" style={btnStyle}>{isRegister ? "Register" : "Login"}</button>
      </form>
      <p style={{ cursor: "pointer", color: "#0066cc" }} onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Already have an account? Login" : "No account? Register"}
      </p>
    </div>
  );
}

function Layout({ children, user, onLogout }) {
  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <nav style={{ background: "#1a1a2e", padding: "12px 24px", display: "flex", gap: 24, alignItems: "center", color: "#fff" }}>
        <span style={{ fontWeight: "bold", fontSize: 18 }}>🏃 RP</span>
        <Link to="/workouts" style={{ color: "#fff", textDecoration: "none" }}>Workouts</Link>
        <Link to="/dashboard" style={{ color: "#fff", textDecoration: "none" }}>Dashboard</Link>
        <span style={{ flex: 1 }} />
        <span>{user?.name}</span>
        <button onClick={onLogout} style={{ background: "#e94560", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 4, cursor: "pointer" }}>Logout</button>
      </nav>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

function Protected({ user, children }) {
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/workouts" /> : <Login setUser={handleLogin} />} />
        <Route path="/workouts" element={<Protected user={user}><Layout user={user} onLogout={handleLogout}><Workouts /></Layout></Protected>} />
        <Route path="/dashboard" element={<Protected user={user}><Layout user={user} onLogout={handleLogout}><Dashboard /></Layout></Protected>} />
        <Route path="*" element={<Navigate to={user ? "/workouts" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

const inputStyle = {
  display: "block", width: "100%", padding: 10, margin: "10px 0", fontSize: 16, borderRadius: 4, border: "1px solid #ccc", boxSizing: "border-box",
};

const btnStyle = {
  display: "block", width: "100%", padding: 12, fontSize: 16, background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", marginTop: 10,
};
