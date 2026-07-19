const express = require("express");
const cors = require("cors");
const { createQueries } = require("./queries");

function createApp(deps) {
  const { pool, initDb } = deps?.database || require("./database");
  const { auth } = deps?.middleware || require("./middleware");
  const q = deps?.queries || createQueries(pool);
  const http = deps?.http || require("axios");
  const cache = deps?.cache || require("./redis");
  const swagger = deps?.swagger || require("./swagger.json");

  const WORKOUT_SERVICE_URL = process.env.WORKOUT_SERVICE_URL || "http://workout-service:3002";

  // ── Circuit Breaker ──
  let workoutCircuit = null;
  if (deps?.cockatiel) {
    const { circuitBreaker, handleAll, ConsecutiveBreaker, isBrokenCircuitError } = deps.cockatiel;
    workoutCircuit = circuitBreaker(handleAll, {
      halfOpenAfter: 15_000,
      breaker: new ConsecutiveBreaker(3),
    });
    workoutCircuit.onBreak(() => console.warn("[circuit] OPEN — workout-service is unavailable"));
    workoutCircuit.onHalfOpen(() => console.warn("[circuit] HALF-OPEN — testing workout-service"));
    workoutCircuit.onReset(() => console.warn("[circuit] CLOSED — workout-service is healthy"));
  } else {
    try {
      const cockatiel = require("cockatiel");
      const { circuitBreaker, handleAll, ConsecutiveBreaker } = cockatiel;
      workoutCircuit = circuitBreaker(handleAll, {
        halfOpenAfter: 15_000,
        breaker: new ConsecutiveBreaker(3),
      });
      workoutCircuit.onBreak(() => console.warn("[circuit] OPEN — workout-service is unavailable"));
      workoutCircuit.onHalfOpen(() => console.warn("[circuit] HALF-OPEN — testing workout-service"));
      workoutCircuit.onReset(() => console.warn("[circuit] CLOSED — workout-service is healthy"));
    } catch (_e) {
      // cockatiel not available — no circuit breaker
    }
  }

  const app = express();
  app.use(cors());
  app.use(express.json());

  /* ─────────────── HELPERS ─────────────── */

  async function fetchWorkouts(userId, from, to, authHeader) {
    const exec = async () => {
      const res = await http.get(`${WORKOUT_SERVICE_URL}/workouts`, {
        params: { from, to, limit: 10000 },
        headers: { Authorization: authHeader },
      });
      return res.data.workouts;
    };

    if (workoutCircuit) {
      return workoutCircuit.execute(exec);
    }
    return exec();
  }

  function computeStats(workouts) {
    let totalDistance = 0, totalDuration = 0;
    for (const w of workouts) {
      totalDistance += parseFloat(w.distance_km) || 0;
      totalDuration += parseInt(w.duration_min) || 0;
    }
    return { distanceKm: totalDistance, durationMin: totalDuration, count: workouts.length };
  }

  function getISOWeek(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split("T")[0];
  }

  function getMonthStart(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  }

  /* ─────────────── STATS ENDPOINTS ─────────────── */

  app.get("/stats/weekly", auth, async (req, res) => {
    try {
      const weeks = parseInt(req.query.weeks) || 4;
      const cacheKey = `weekly:${req.user.userId}:${weeks}`;

      const cached = await cache.getCached(cacheKey);
      if (cached) return res.json(cached);

      let stats = await q.getWeeklyStats(req.user.userId, weeks);

      if (stats.length < weeks) {
        const to = new Date().toISOString().split("T")[0];
        const from = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const workouts = await fetchWorkouts(req.user.userId, from, to, req.headers.authorization);

        const weekly = {};
        for (const w of workouts) {
          const wk = getISOWeek(w.date);
          if (!weekly[wk]) weekly[wk] = [];
          weekly[wk].push(w);
        }

        for (const [weekStart, list] of Object.entries(weekly)) {
          const totals = computeStats(list);
          await q.upsertWeeklyStats(req.user.userId, weekStart, totals);
        }

        stats = await q.getWeeklyStats(req.user.userId, weeks);
      }

      const result = { weeks: stats };
      await cache.setCache(cacheKey, result);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/stats/monthly", auth, async (req, res) => {
    try {
      const months = parseInt(req.query.months) || 3;
      const cacheKey = `monthly:${req.user.userId}:${months}`;

      const cached = await cache.getCached(cacheKey);
      if (cached) return res.json(cached);

      let stats = await q.getMonthlyStats(req.user.userId, months);

      if (stats.length < months) {
        const to = new Date().toISOString().split("T")[0];
        const from = new Date(Date.now() - months * 31 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const workouts = await fetchWorkouts(req.user.userId, from, to, req.headers.authorization);

        const monthly = {};
        for (const w of workouts) {
          const ms = getMonthStart(w.date);
          if (!monthly[ms]) monthly[ms] = [];
          monthly[ms].push(w);
        }

        for (const [monthStart, list] of Object.entries(monthly)) {
          const totals = computeStats(list);
          await q.upsertMonthlyStats(req.user.userId, monthStart, totals);
        }

        stats = await q.getMonthlyStats(req.user.userId, months);
      }

      const result = { months: stats };
      await cache.setCache(cacheKey, result);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/stats/personal-bests", auth, async (req, res) => {
    try {
      const cacheKey = `bests:${req.user.userId}`;
      const cached = await cache.getCached(cacheKey);
      if (cached) return res.json(cached);

      let bests = await q.getPersonalBests(req.user.userId);

      if (bests.length === 0) {
        const to = new Date().toISOString().split("T")[0];
        const from = "2020-01-01";
        const workouts = await fetchWorkouts(req.user.userId, from, to, req.headers.authorization);

        if (workouts.length > 0) {
          let longest = null, fastest5k = null, fastest10k = null, mostElev = null;

          for (const w of workouts) {
            const d = parseFloat(w.distance_km);
            const dur = parseInt(w.duration_min);
            const pace = parseFloat(w.pace_min_per_km);
            const elev = parseInt(w.elevation_m) || 0;

            if (!longest || d > longest.distance) longest = { distance: d, date: w.date, id: w.id };
            if (d >= 4.5 && d <= 5.5 && (!fastest5k || pace < fastest5k.pace)) fastest5k = { pace: pace || dur / d, date: w.date, id: w.id };
            if (d >= 9 && d <= 11 && (!fastest10k || pace < fastest10k.pace)) fastest10k = { pace: pace || dur / d, date: w.date, id: w.id };
            if (!mostElev || elev > mostElev.elevation) mostElev = { elevation: elev, date: w.date, id: w.id };
          }

          if (longest) await q.upsertPersonalBest(req.user.userId, "longest_run", longest.distance, longest.date);
          if (fastest5k) await q.upsertPersonalBest(req.user.userId, "fastest_5k", fastest5k.pace, fastest5k.date);
          if (fastest10k) await q.upsertPersonalBest(req.user.userId, "fastest_10k", fastest10k.pace, fastest10k.date);
          if (mostElev) await q.upsertPersonalBest(req.user.userId, "most_elevation", mostElev.elevation, mostElev.date);

          bests = await q.getPersonalBests(req.user.userId);
        }
      }

      const result = { bests };
      await cache.setCache(cacheKey, result);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/stats/progress", auth, async (req, res) => {
    try {
      const metric = req.query.metric || "distance";
      const period = req.query.period || "monthly";

      const cacheKey = `progress:${req.user.userId}:${metric}:${period}`;
      const cached = await cache.getCached(cacheKey);
      if (cached) return res.json(cached);

      const now = new Date();
      let currentStart, previousStart, previousEnd, currentEnd;

      if (period === "weekly") {
        currentStart = getISOWeek(now);
        previousStart = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        previousEnd = currentStart;
        currentEnd = now.toISOString().split("T")[0];
      } else {
        currentStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
        previousEnd = currentStart;
        currentEnd = now.toISOString().split("T")[0];
      }

      const currentWorkouts = await fetchWorkouts(req.user.userId, currentStart, currentEnd, req.headers.authorization);
      const previousWorkouts = await fetchWorkouts(req.user.userId, previousStart, previousEnd, req.headers.authorization);

      const current = computeStats(currentWorkouts);
      const previous = computeStats(previousWorkouts);

      let currentVal, previousVal;
      if (metric === "duration") { currentVal = current.durationMin; previousVal = previous.durationMin; }
      else if (metric === "count") { currentVal = current.count; previousVal = previous.count; }
      else { currentVal = current.distanceKm; previousVal = previous.distanceKm; }

      const change = currentVal - previousVal;
      const percentage = previousVal > 0 ? ((change / previousVal) * 100).toFixed(1) : null;

      const result = { current: currentVal, previous: previousVal, change, percentage: percentage ? parseFloat(percentage) : null, metric, period };
      await cache.setCache(cacheKey, result);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  /* ─────────────── INGEST (webhook da workout service) ─────────────── */

  app.post("/stats/ingest", auth, async (req, res) => {
    try {
      const { action, workout } = req.body;
      const keys = await cache.redis.keys(`*:${req.user.userId}:*`);
      if (keys.length > 0) await cache.redis.del(keys);
      res.json({ message: "Cache invalidated", keysRemoved: keys.length });
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
  const PORT = process.env.PORT || 3003;
  instance.initDb().then(() => {
    instance.app.listen(PORT, () => console.log(`📊 Stats Service on port ${PORT}`));
  });
}

module.exports = instance.app;
module.exports.createApp = createApp;
