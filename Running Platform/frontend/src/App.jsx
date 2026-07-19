import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { login, register, logout } from "./api";
import { ToastProvider } from "./Toast";
import Workouts from "./Workouts";
import Dashboard from "./Dashboard";
import Profile from "./Profile";

function Login({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = isRegister
        ? await register(form.email, form.password, form.name)
        : await login(form.email, form.password);
      setUser(data.user);
      navigate("/workouts");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">🏃</h1>
          <h2 className="text-2xl font-bold text-gray-800 mt-2">Running Platform</h2>
          <p className="text-gray-500 text-sm mt-1">
            {isRegister ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm"
          />
          <button
            type="submit"
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition cursor-pointer"
          >
            {isRegister ? "Register" : "Login"}
          </button>
        </form>

        <p
          className="text-center text-sm text-primary mt-6 cursor-pointer hover:underline"
          onClick={() => { setIsRegister(!isRegister); setError(""); }}
        >
          {isRegister ? "Already have an account? Login" : "No account? Register"}
        </p>
      </div>
    </div>
  );
}

function Layout({ children, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: "/workouts", label: "Workouts" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/profile", label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <nav className="bg-primary-dark text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link to="/workouts" className="font-bold text-lg">🏃 RP</Link>
              <div className="hidden sm:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-white/80 hover:text-white transition text-sm font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/70 text-sm hidden sm:inline">{user?.name}</span>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="sm:hidden text-white/80 hover:text-white cursor-pointer"
              >
                {menuOpen ? "✕" : "☰"}
              </button>
              <button
                onClick={onLogout}
                className="bg-danger hover:bg-danger/80 text-white text-sm px-4 py-1.5 rounded-lg transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
          {/* Mobile menu */}
          {menuOpen && (
            <div className="sm:hidden pb-3 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-white/80 hover:text-white transition text-sm font-medium py-1"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <span className="text-white/50 text-sm py-1">{user?.name}</span>
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
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
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/workouts" /> : <Login setUser={handleLogin} />} />
          <Route path="/workouts" element={<Protected user={user}><Layout user={user} onLogout={handleLogout}><Workouts /></Layout></Protected>} />
          <Route path="/dashboard" element={<Protected user={user}><Layout user={user} onLogout={handleLogout}><Dashboard /></Layout></Protected>} />
          <Route path="/profile" element={<Protected user={user}><Layout user={user} onLogout={handleLogout}><Profile /></Layout></Protected>} />
          <Route path="*" element={<Navigate to={user ? "/workouts" : "/login"} />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
