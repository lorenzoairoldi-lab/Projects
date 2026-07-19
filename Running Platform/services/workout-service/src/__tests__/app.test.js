import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const mockWorkout = (overrides = {}) => ({
  id: "w-001",
  user_id: "user-1",
  date: "2024-01-15T00:00:00.000Z",
  distance_km: 10,
  duration_min: 50,
  pace_min_per_km: "5.00",
  elevation_m: 0,
  notes: null,
  created_at: "2024-01-15T10:00:00.000Z",
  updated_at: "2024-01-15T10:00:00.000Z",
  ...overrides,
});

describe("Workout Service — CRUD", () => {
  let app;
  let mockPool;
  const mockAuth = (req, _res, next) => {
    req.user = { userId: "user-1" };
    next();
  };

  beforeEach(() => {
    mockPool = { query: vi.fn() };
    const instance = createApp({
      database: { pool: mockPool, initDb: vi.fn().mockResolvedValue() },
      middleware: { auth: mockAuth },
    });
    app = instance.app;
  });

  /* ── POST /workouts ── */

  describe("POST /workouts", () => {
    it("creates a workout and returns 201", async () => {
      const workout = mockWorkout();
      mockPool.query.mockResolvedValue({ rows: [workout] });

      const res = await request(app)
        .post("/workouts")
        .send({ distanceKm: 10, durationMin: 50 });

      expect(res.status).toBe(201);
      expect(res.body.workout.id).toBe("w-001");
      expect(mockPool.query).toHaveBeenCalledOnce();
    });

    it("returns 400 when distanceKm is missing", async () => {
      const res = await request(app)
        .post("/workouts")
        .send({ durationMin: 50 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it("returns 400 when durationMin is missing", async () => {
      const res = await request(app)
        .post("/workouts")
        .send({ distanceKm: 10 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it("returns 400 when distanceKm is zero or negative", async () => {
      const res = await request(app)
        .post("/workouts")
        .send({ distanceKm: -5, durationMin: 30 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/positive/i);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it("returns 400 when durationMin is zero or negative", async () => {
      const res = await request(app)
        .post("/workouts")
        .send({ distanceKm: 10, durationMin: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/positive/i);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it("auto-calculates pace when not provided", async () => {
      const workout = mockWorkout({ pace_min_per_km: "5.00" });
      mockPool.query.mockResolvedValue({ rows: [workout] });

      const res = await request(app)
        .post("/workouts")
        .send({ distanceKm: 10, durationMin: 50 });

      expect(res.status).toBe(201);
      const insertSql = mockPool.query.mock.calls[0][0];
      expect(insertSql).toContain("pace_min_per_km");
    });

    it("accepts optional elevationM and notes", async () => {
      const workout = mockWorkout({ elevation_m: 120, notes: "Trail run" });
      mockPool.query.mockResolvedValue({ rows: [workout] });

      const res = await request(app)
        .post("/workouts")
        .send({ distanceKm: 10, durationMin: 50, elevationM: 120, notes: "Trail run" });

      expect(res.status).toBe(201);
      expect(res.body.workout.elevation_m).toBe(120);
      expect(res.body.workout.notes).toBe("Trail run");
    });
  });

  /* ── GET /workouts ── */

  describe("GET /workouts", () => {
    it("returns a paginated list of workouts", async () => {
      const workouts = [mockWorkout(), mockWorkout({ id: "w-002", distance_km: 5 })];
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: "2" }] })
        .mockResolvedValueOnce({ rows: workouts });

      const res = await request(app).get("/workouts");

      expect(res.status).toBe(200);
      expect(res.body.workouts).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });
  });

  /* ── GET /workouts/:id ── */

  describe("GET /workouts/:id", () => {
    it("returns a single workout", async () => {
      mockPool.query.mockResolvedValue({ rows: [mockWorkout()] });

      const res = await request(app).get("/workouts/w-001");

      expect(res.status).toBe(200);
      expect(res.body.workout.id).toBe("w-001");
    });

    it("returns 404 for a non-existent workout", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const res = await request(app).get("/workouts/nonexistent");

      expect(res.status).toBe(404);
    });
  });

  /* ── PUT /workouts/:id ── */

  describe("PUT /workouts/:id", () => {
    it("updates a workout and returns the updated object", async () => {
      const updated = mockWorkout({ distance_km: 12, notes: "Long run" });
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockWorkout()] })
        .mockResolvedValueOnce({ rows: [updated] });

      const res = await request(app)
        .put("/workouts/w-001")
        .send({ distanceKm: 12, notes: "Long run" });

      expect(res.status).toBe(200);
      expect(res.body.workout.distance_km).toBe(12);
    });

    it("returns 400 when no fields are sent", async () => {
      const res = await request(app)
        .put("/workouts/w-001")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/no fields/i);
    });
  });

  /* ── DELETE /workouts/:id ── */

  describe("DELETE /workouts/:id", () => {
    it("deletes a workout and returns 204", async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      const res = await request(app).delete("/workouts/w-001");

      expect(res.status).toBe(204);
    });

    it("returns 404 when workout does not exist", async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 });

      const res = await request(app).delete("/workouts/nonexistent");

      expect(res.status).toBe(404);
    });
  });
});
