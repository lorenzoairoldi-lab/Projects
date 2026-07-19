const express = require("express");
const cors = require("cors");

function createApp(deps) {
  const { pool, initDb } = deps?.database || require("./database");
  const { auth } = deps?.middleware || require("./middleware");
  const { createQueries } = require("./queries");
  const q = deps?.queries || createQueries(pool);
  const bcrypt = deps?.bcrypt || require("bcryptjs");
  const jwt = deps?.jwt || require("jsonwebtoken");
  const crypto = deps?.crypto || require("crypto");
  const swagger = deps?.swagger || require("./swagger.json");

  const app = express();
  app.use(cors());
  app.use(express.json());

  const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

  /* ─────────────── AUTH ─────────────── */

  app.post("/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name)
        return res.status(400).json({ error: "email, password, name required" });

      const existing = await q.findUserByEmail(email);
      if (existing) return res.status(409).json({ error: "Email already registered" });

      const hash = await bcrypt.hash(password, 10);
      const user = await q.createUser(email, hash, name);

      await pool.query("INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING", [user.id]);

      const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "15m" });
      const refreshToken = crypto.randomBytes(64).toString("hex");
      await q.saveRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

      res.status(201).json({ user, accessToken, refreshToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "email, password required" });

      const user = await q.findUserByEmail(email);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ error: "Invalid credentials" });

      const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "15m" });
      const refreshToken = crypto.randomBytes(64).toString("hex");
      await q.saveRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

      const { password_hash, ...safe } = user;
      res.json({ user: safe, accessToken, refreshToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });

      const stored = await q.findRefreshToken(refreshToken);
      if (!stored || stored.expires_at < new Date())
        return res.status(401).json({ error: "Invalid or expired refresh token" });

      await q.deleteRefreshToken(refreshToken);
      const user = await q.findUserById(stored.user_id);
      if (!user) return res.status(401).json({ error: "User not found" });

      const newAccess = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "15m" });
      const newRefresh = crypto.randomBytes(64).toString("hex");
      await q.saveRefreshToken(user.id, newRefresh, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

      res.json({ accessToken: newAccess, refreshToken: newRefresh });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/auth/logout", auth, async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) await q.deleteRefreshToken(refreshToken);
      res.json({ message: "Logged out" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/auth/me", auth, async (req, res) => {
    try {
      const user = await q.findUserById(req.user.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  /* ─────────────── PROFILE ─────────────── */

  app.get("/profiles/me", auth, async (req, res) => {
    try {
      const profile = await q.getProfile(req.user.userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json({ profile });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/profiles/me", auth, async (req, res) => {
    try {
      const { bio, weightKg, heightCm, experienceLevel } = req.body;
      const profile = await q.upsertProfile(req.user.userId, {
        bio, weight_kg: weightKg, height_cm: heightCm, experience_level: experienceLevel,
      });
      res.json({ profile });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  /* ─────────────── SWAGGER ─────────────── */

  app.get("/swagger.json", (req, res) => res.json(swagger));

  return { app, initDb };
}

/* ─────────────── START (solo se non in test) ─────────────── */

const instance = createApp();

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3001;
  instance.initDb().then(() => {
    instance.app.listen(PORT, () => console.log(`🔐 Auth Service on port ${PORT}`));
  });
}

module.exports = instance.app;
module.exports.createApp = createApp;
