import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const mockUser = (overrides = {}) => ({
  id: "u-001",
  email: "test@example.com",
  name: "Test Runner",
  password_hash: "$2a$10$hashedpassword",
  created_at: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const mockSafeUser = () => ({
  id: "u-001",
  email: "test@example.com",
  name: "Test Runner",
  created_at: "2024-01-01T00:00:00.000Z",
});

const mockProfile = (overrides = {}) => ({
  user_id: "u-001",
  bio: "Runner",
  weight_kg: 70,
  height_cm: 175,
  experience_level: "intermediate",
  updated_at: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

describe("Auth Service", () => {
  let app;
  let mockPool;
  let mockBcrypt;
  let mockJwt;
  let mockCrypto;

  const mockAuth = (req, _res, next) => {
    req.user = { userId: "u-001", email: "test@example.com" };
    next();
  };

  beforeEach(() => {
    mockPool = { query: vi.fn() };
    mockBcrypt = {
      hash: vi.fn().mockResolvedValue("$2a$10$hashedpassword"),
      compare: vi.fn().mockResolvedValue(true),
    };
    mockJwt = {
      sign: vi.fn().mockReturnValue("mock-access-token"),
      verify: vi.fn().mockReturnValue({ userId: "u-001", email: "test@example.com" }),
    };
    mockCrypto = {
      randomBytes: vi.fn().mockReturnValue(Buffer.alloc(64).fill("a")),
    };

    const instance = createApp({
      database: { pool: mockPool, initDb: vi.fn().mockResolvedValue() },
      middleware: { auth: mockAuth },
      bcrypt: mockBcrypt,
      jwt: mockJwt,
      crypto: mockCrypto,
    });
    app = instance.app;
  });

  /* ── POST /auth/register ── */

  describe("POST /auth/register", () => {
    it("creates a new user and returns 201", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })                              // findUserByEmail
        .mockResolvedValueOnce({ rows: [mockUser()] })                    // createUser
        .mockResolvedValueOnce({ rows: [] })                              // INSERT profiles
        .mockResolvedValueOnce({ rows: [] });                              // saveRefreshToken

      const res = await request(app)
        .post("/auth/register")
        .send({ email: "test@example.com", password: "secret123", name: "Test Runner" });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.accessToken).toBe("mock-access-token");
      expect(mockPool.query).toHaveBeenCalledTimes(4);
    });

    it("returns 400 when fields are missing", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it("returns 409 when email is already registered", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser()] });        // findUserByEmail — found

      const res = await request(app)
        .post("/auth/register")
        .send({ email: "test@example.com", password: "secret123", name: "Test Runner" });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already registered/i);
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });

  /* ── POST /auth/login ── */

  describe("POST /auth/login", () => {
    it("logs in with valid credentials and returns 200", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockUser()] })                    // findUserByEmail
        .mockResolvedValueOnce({ rows: [] });                              // saveRefreshToken

      const res = await request(app)
        .post("/auth/login")
        .send({ email: "test@example.com", password: "secret123" });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBe("mock-access-token");
      expect(res.body.user).not.toHaveProperty("password_hash");
    });

    it("returns 401 when email is not found", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });                  // findUserByEmail — empty

      const res = await request(app)
        .post("/auth/login")
        .send({ email: "unknown@example.com", password: "secret123" });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid credentials/i);
    });

    it("returns 401 when password is wrong", async () => {
      mockBcrypt.compare.mockResolvedValueOnce(false);
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser()] });        // findUserByEmail

      const res = await request(app)
        .post("/auth/login")
        .send({ email: "test@example.com", password: "wrongpass" });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid credentials/i);
    });

    it("returns 400 when email or password is missing", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(400);
    });
  });

  /* ── POST /auth/refresh ── */

  describe("POST /auth/refresh", () => {
    it("returns new tokens with valid refresh token", async () => {
      const future = new Date(Date.now() + 3600000);
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ user_id: "u-001", expires_at: future }] })  // findRefreshToken
        .mockResolvedValueOnce({ rows: [] })                                            // deleteRefreshToken
        .mockResolvedValueOnce({ rows: [mockSafeUser()] })                              // findUserById
        .mockResolvedValueOnce({ rows: [] });                                            // saveRefreshToken

      const res = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken: "valid-refresh-token" });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBe("mock-access-token");
    });

    it("returns 401 when refresh token is expired", async () => {
      const past = new Date(Date.now() - 3600000);
      mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: "u-001", expires_at: past }] });

      const res = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken: "expired-refresh-token" });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/expired/i);
    });

    it("returns 400 when refreshToken is missing", async () => {
      const res = await request(app)
        .post("/auth/refresh")
        .send({});

      expect(res.status).toBe(400);
    });
  });

  /* ── POST /auth/logout ── */

  describe("POST /auth/logout", () => {
    it("returns 200 and deletes the refresh token", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });                  // deleteRefreshToken

      const res = await request(app)
        .post("/auth/logout")
        .send({ refreshToken: "some-token" });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/logged out/i);
    });
  });

  /* ── GET /auth/me ── */

  describe("GET /auth/me", () => {
    it("returns the authenticated user", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [mockSafeUser()] });    // findUserById

      const res = await request(app).get("/auth/me");

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("test@example.com");
    });

    it("returns 404 when user is not found", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });                  // findUserById

      const res = await request(app).get("/auth/me");

      expect(res.status).toBe(404);
    });
  });

  /* ── Profile endpoints ── */

  describe("Profile endpoints", () => {
    it("GET /profiles/me returns the profile", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [mockProfile()] });

      const res = await request(app).get("/profiles/me");

      expect(res.status).toBe(200);
      expect(res.body.profile.bio).toBe("Runner");
    });

    it("GET /profiles/me returns 404 when no profile exists", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get("/profiles/me");

      expect(res.status).toBe(404);
    });

    it("PUT /profiles/me updates and returns the profile", async () => {
      const updated = mockProfile({ bio: "Marathoner" });
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })                               // upsert INSERT
        .mockResolvedValueOnce({ rows: [updated] });                        // getProfile (inside upsert)

      const res = await request(app)
        .put("/profiles/me")
        .send({ bio: "Marathoner", weightKg: 72 });

      expect(res.status).toBe(200);
      expect(res.body.profile.bio).toBe("Marathoner");
    });
  });
});
