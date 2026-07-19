const express = require("express");
const cors = require("cors");
const { createQueries } = require("./queries");

function createApp(deps) {
  const { pool, initDb } = deps?.database || require("./database");
  const { auth } = deps?.middleware || require("./middleware");
  const q = deps?.queries || createQueries(pool);
  const swagger = deps?.swagger || require("./swagger.json");

  const app = express();
  app.use(cors());
  app.use(express.json());

  /* ─────────────── WORKOUTS CRUD ─────────────── */

  app.post("/workouts", auth, async (req, res) => {
    try {
      const { date, distanceKm, durationMin, pace, elevationM, notes } = req.body;
      if (distanceKm == null || durationMin == null)
        return res.status(400).json({ error: "distanceKm and durationMin required" });
      if (distanceKm <= 0 || durationMin <= 0)
        return res.status(400).json({ error: "distanceKm and durationMin must be positive" });

      const workout = await q.create(req.user.userId, { date, distanceKm, durationMin, pace, elevationM, notes });
      res.status(201).json({ workout });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/workouts", auth, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const { from, to } = req.query;
      const result = await q.list(req.user.userId, page, limit, from, to);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/workouts/:id", auth, async (req, res) => {
    try {
      const workout = await q.getById(req.user.userId, req.params.id);
      if (!workout) return res.status(404).json({ error: "Workout not found" });
      res.json({ workout });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/workouts/:id", auth, async (req, res) => {
    try {
      const allowed = ["distanceKm", "durationMin", "pace", "elevationM", "notes"];
      const data = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) data[key] = req.body[key];
      }
      if (Object.keys(data).length === 0)
        return res.status(400).json({ error: "No fields to update" });

      const workout = await q.update(req.user.userId, req.params.id, data);
      if (!workout) return res.status(404).json({ error: "Workout not found" });
      res.json({ workout });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.delete("/workouts/:id", auth, async (req, res) => {
    try {
      const deleted = await q.remove(req.user.userId, req.params.id);
      if (!deleted) return res.status(404).json({ error: "Workout not found" });
      res.status(204).send();
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
  const PORT = process.env.PORT || 3002;
  instance.initDb().then(() => {
    instance.app.listen(PORT, () => console.log(`🏃 Workout Service on port ${PORT}`));
  });
}

module.exports = instance.app;
module.exports.createApp = createApp;
