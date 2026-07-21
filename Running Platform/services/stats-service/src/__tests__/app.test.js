import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import cockatiel from "cockatiel";

const mockWorkout = (overrides = {}) => ({
  id: "w-001",
  user_id: "user-1",
  date: "2024-01-15T00:00:00.000Z",
  distance_km: 10,
  duration_min: 50,
  pace_min_per_km: "5.00",
  elevation_m: 0,
  notes: null,
  ...overrides,
});

const mockWeeklyStat = (overrides = {}) => ({
  user_id: "user-1",
  week_start: "2024-01-15",
  total_distance_km: 30,
  total_duration_min: 150,
  workout_count: 3,
  ...overrides,
});

const mockMonthlyStat = (overrides = {}) => ({
  user_id: "user-1",
  month_start: "2024-01-01",
  total_distance_km: 100,
  total_duration_min: 500,
  workout_count: 10,
  ...overrides,
});

const mockBest = (overrides = {}) => ({
  user_id: "user-1",
  metric: "longest_run",
  value: 21.1,
  achieved_date: "2024-01-15",
  ...overrides,
});

describe("Stats Service", () => {
  let app;
  let mockHttp;
  let mockCache;
  let mockQueries;
  let mockDatabase;

  const mockAuth = (req, _res, next) => {
    req.user = { userId: "user-1" };
    next();
  };

  beforeEach(() => {
    mockHttp = { get: vi.fn().mockResolvedValue({ data: { workouts: [mockWorkout()] } }) };
    mockCache = {
      getCached: vi.fn().mockResolvedValue(null),
      setCache: vi.fn().mockResolvedValue(undefined),
      redis: {
        keys: vi.fn().mockResolvedValue([]),
        del: vi.fn().mockResolvedValue(0),
      },
    };
    mockQueries = {
      getWeeklyStats: vi.fn().mockResolvedValue([
        mockWeeklyStat({ week_start: "2024-01-15" }),
        mockWeeklyStat({ week_start: "2024-01-08" }),
        mockWeeklyStat({ week_start: "2024-01-01" }),
        mockWeeklyStat({ week_start: "2023-12-25" }),
      ]),
      upsertWeeklyStats: vi.fn().mockResolvedValue(undefined),
      deleteWeeklyStats: vi.fn().mockResolvedValue(undefined),
      getMonthlyStats: vi.fn().mockResolvedValue([
        mockMonthlyStat({ month_start: "2024-01-01" }),
        mockMonthlyStat({ month_start: "2023-12-01" }),
        mockMonthlyStat({ month_start: "2023-11-01" }),
      ]),
      upsertMonthlyStats: vi.fn().mockResolvedValue(undefined),
      deleteMonthlyStats: vi.fn().mockResolvedValue(undefined),
      getPersonalBests: vi.fn().mockResolvedValue([mockBest()]),
      upsertPersonalBest: vi.fn().mockResolvedValue(undefined),
      deletePersonalBests: vi.fn().mockResolvedValue(undefined),
    };
    mockDatabase = {
      pool: { query: vi.fn() },
      initDb: vi.fn().mockResolvedValue(),
    };

    const instance = createApp({
      database: mockDatabase,
      middleware: { auth: mockAuth },
      queries: mockQueries,
      http: mockHttp,
      cache: mockCache,
      cockatiel,
    });
    app = instance.app;
  });

  /* ── GET /stats/weekly ── */

  describe("GET /stats/weekly", () => {
    it("returns cached data when available", async () => {
      const cachedData = { weeks: [mockWeeklyStat()] };
      mockCache.getCached.mockResolvedValue(cachedData);

      const res = await request(app).get("/stats/weekly?weeks=4");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(cachedData);
      expect(mockQueries.getWeeklyStats).not.toHaveBeenCalled();
    });

    it("returns stats from DB when cache misses and DB has enough data", async () => {
      const res = await request(app).get("/stats/weekly?weeks=4");

      expect(res.status).toBe(200);
      expect(res.body.weeks).toHaveLength(4);
      expect(mockQueries.getWeeklyStats).toHaveBeenCalledWith("user-1", 4);
      expect(mockCache.setCache).toHaveBeenCalled();
      expect(mockHttp.get).not.toHaveBeenCalled();
    });

    it("fetches workouts when DB has fewer rows than requested weeks", async () => {
      mockQueries.getWeeklyStats
        .mockResolvedValueOnce([])                         // first call — not enough data
        .mockResolvedValueOnce([mockWeeklyStat()]);         // second call — after upsert

      const res = await request(app).get("/stats/weekly?weeks=4");

      expect(res.status).toBe(200);
      expect(mockHttp.get).toHaveBeenCalledOnce();
      expect(mockQueries.upsertWeeklyStats).toHaveBeenCalled();
    });
  });

  /* ── GET /stats/monthly ── */

  describe("GET /stats/monthly", () => {
    it("returns stats from DB when cache misses", async () => {
      const res = await request(app).get("/stats/monthly?months=3");

      expect(res.status).toBe(200);
      expect(res.body.months).toHaveLength(3);
      expect(mockQueries.getMonthlyStats).toHaveBeenCalledWith("user-1", 3);
    });

    it("fetches workouts when DB has fewer rows than requested months", async () => {
      mockQueries.getMonthlyStats
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockMonthlyStat()]);

      const res = await request(app).get("/stats/monthly?months=3");

      expect(res.status).toBe(200);
      expect(mockHttp.get).toHaveBeenCalledOnce();
    });
  });

  /* ── GET /stats/personal-bests ── */

  describe("GET /stats/personal-bests", () => {
    it("returns cached bests when available", async () => {
      const cachedData = { bests: [mockBest()] };
      mockCache.getCached.mockResolvedValue(cachedData);

      const res = await request(app).get("/stats/personal-bests");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(cachedData);
      expect(mockQueries.getPersonalBests).not.toHaveBeenCalled();
    });

    it("returns bests from DB when cache misses", async () => {
      const res = await request(app).get("/stats/personal-bests");

      expect(res.status).toBe(200);
      expect(res.body.bests).toHaveLength(1);
      expect(mockQueries.getPersonalBests).toHaveBeenCalledWith("user-1");
    });

    it("computes bests from workouts when DB has none", async () => {
      mockQueries.getPersonalBests
        .mockResolvedValueOnce([])                         // first call — empty
        .mockResolvedValueOnce([mockBest(), mockBest({ metric: "fastest_5k", value: 4.5 })]);  // after upsert

      const res = await request(app).get("/stats/personal-bests");

      expect(res.status).toBe(200);
      expect(mockHttp.get).toHaveBeenCalledOnce();
      expect(mockQueries.upsertPersonalBest).toHaveBeenCalled();
    });
  });

  /* ── GET /stats/progress ── */

  describe("GET /stats/progress", () => {
    it("returns progress comparison between current and previous period", async () => {
      mockHttp.get
        .mockResolvedValueOnce({ data: { workouts: [mockWorkout({ distance_km: 15, duration_min: 75 })] } })
        .mockResolvedValueOnce({ data: { workouts: [mockWorkout({ distance_km: 10, duration_min: 50 })] } });

      const res = await request(app).get("/stats/progress?metric=distance&period=monthly");

      expect(res.status).toBe(200);
      expect(res.body.current).toBe(15);
      expect(res.body.previous).toBe(10);
      expect(res.body.change).toBe(5);
      expect(res.body.percentage).toBe(50);
    });

    it("handles zero previous value", async () => {
      mockHttp.get
        .mockResolvedValueOnce({ data: { workouts: [mockWorkout({ distance_km: 10 })] } })
        .mockResolvedValueOnce({ data: { workouts: [] } });

      const res = await request(app).get("/stats/progress?metric=distance&period=monthly");

      expect(res.status).toBe(200);
      expect(res.body.current).toBe(10);
      expect(res.body.previous).toBe(0);
      expect(res.body.percentage).toBeNull();
    });
  });

  /* ── POST /stats/ingest ── */

  describe("POST /stats/ingest", () => {
    it("invalidates cache for the user", async () => {
      mockCache.redis.keys.mockResolvedValue(["weekly:user-1:4", "bests:user-1"]);
      mockCache.redis.del.mockResolvedValue(2);

      const res = await request(app)
        .post("/stats/ingest")
        .send({ action: "create", workout: mockWorkout() });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Cache and PG stats invalidated");
      expect(mockCache.redis.keys).toHaveBeenCalled();
      expect(mockCache.redis.del).toHaveBeenCalled();
      expect(mockQueries.deleteWeeklyStats).toHaveBeenCalledWith("user-1");
      expect(mockQueries.deleteMonthlyStats).toHaveBeenCalledWith("user-1");
      expect(mockQueries.deletePersonalBests).toHaveBeenCalledWith("user-1");
    });
  });
});
