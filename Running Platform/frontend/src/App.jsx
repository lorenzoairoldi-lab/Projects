import React, { useState, useEffect } from "react";
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
    <div className="min-h-screen bg-surface dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md card dark:bg-slate-800 dark:border-slate-700 p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-2xl mx-auto mb-4 text-3xl">🏃</div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Running Platform</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isRegister ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger dark:text-danger/90 rounded-lg px-4 py-3 text-sm mb-4">
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
              className="input dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="input dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="input dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400"
          />
          <button
            type="submit"
            className="btn w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold"
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

function Layout({ children, user, onLogout, darkMode, toggleDarkMode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: "/workouts", label: "Workouts" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/profile", label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-900">
      <nav className="bg-gradient-to-r from-primary to-primary-dark dark:from-slate-800 dark:to-slate-800 text-white shadow-nav border-b border-white/10 dark:border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
                <span
                  onClick={toggleDarkMode}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 text-base cursor-pointer transition-all select-none"
                  title={darkMode ? "Disattiva dark mode" : "Attiva dark mode"}
                >
                  🏃
                </span>
                <Link to="/workouts">
                  <span className="hidden sm:inline">Running Platform</span>
                  <span className="sm:hidden">RP</span>
                </Link>
              </div>
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
              <span className="text-white/40 text-xs hidden sm:inline select-none">
                {darkMode ? "🌙" : "☀️"}
              </span>
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

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

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
          <Route path="/workouts" element={<Protected user={user}><Layout user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Workouts /></Layout></Protected>} />
          <Route path="/dashboard" element={<Protected user={user}><Layout user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Dashboard /></Layout></Protected>} />
          <Route path="/profile" element={<Protected user={user}><Layout user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Profile /></Layout></Protected>} />
          <Route path="*" element={<Navigate to={user ? "/workouts" : "/login"} />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
