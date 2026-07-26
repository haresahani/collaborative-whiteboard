/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { signupSchema, loginSchema } from "../src/modules/auth/auth.validator";

// ---------------------------------------------------------------------------
// We mock the database (Mongoose User model) and crypto libraries so tests
// run instantly without needing a real MongoDB connection.
//
// 💡 WHY MOCK?
// In unit tests we only want to test OUR code logic — not whether MongoDB
// is running. We replace external dependencies with "fake" versions that
// return whatever we tell them to. This makes tests fast, reliable, and
// runnable in CI without any infrastructure.
// ---------------------------------------------------------------------------

// Mock the User model — every Mongoose method becomes a controllable stub
vi.mock("../src/modules/user/user.model", () => ({
  User: {
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(() => ({
      select: vi.fn(),
    })),
  },
}));

// Mock bcrypt — so we don't actually hash passwords during tests
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password_123"),
    compare: vi.fn(),
  },
}));

// Mock jsonwebtoken — so we control what tokens look like
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock_jwt_token_abc"),
    verify: vi.fn(),
  },
}));

// Set the JWT_SECRET env variable for tests
process.env.JWT_SECRET = "test-secret-key";

// Import the mocked modules so we can control their return values per-test
import { User } from "../src/modules/user/user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Import the Express app AFTER mocks are registered
import app from "../src/server";

// ---------------------------------------------------------------------------
// PART 1: Validation Schema Tests (Pure Unit Tests)
//
// 💡 WHAT IS ZOD?
// Zod is a TypeScript library for defining "shapes" of data. You describe
// what valid data looks like (e.g. "email must be a string in email format,
// password must be at least 6 characters"), and Zod can check any incoming
// object against that shape. If it doesn't match, Zod returns detailed
// error messages saying exactly what's wrong.
//
// These tests verify that our schemas correctly accept good data and
// reject bad data — with no Express server or database involved.
// ---------------------------------------------------------------------------

describe("Validation Schemas", () => {
  describe("signupSchema", () => {
    it("accepts valid signup data", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "secure123",
        displayName: "Test User",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email format", () => {
      const result = signupSchema.safeParse({
        email: "not-an-email",
        password: "secure123",
        displayName: "Test User",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password shorter than 6 characters", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "123",
        displayName: "Test User",
      });
      expect(result.success).toBe(false);
    });

    it("rejects displayName shorter than 2 characters", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "secure123",
        displayName: "A",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing fields", () => {
      const result = signupSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("accepts valid login data", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "secure123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = loginSchema.safeParse({
        email: "bad-email",
        password: "secure123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
      });
      expect(result.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// PART 2: API Endpoint Tests (Integration Tests)
//
// 💡 WHAT IS SUPERTEST?
// Supertest lets us send HTTP requests (POST, GET, etc.) to our Express app
// without actually starting a server on a port. It simulates the full
// request/response cycle — so our middleware, validators, and controllers
// all run exactly as they would in production.
//
// Combined with our mocks above, we can test the complete request flow:
//   HTTP Request → Express middleware → Zod validation → Controller logic
//   → (mocked) Database → HTTP Response
// ---------------------------------------------------------------------------

describe("Auth API Endpoints", () => {
  beforeEach(() => {
    // Reset all mock state between tests so they don't interfere
    vi.clearAllMocks();
  });

  // =========================================================================
  // POST /api/auth/signup
  // =========================================================================
  describe("POST /api/auth/signup", () => {
    it("returns 400 when request body is empty (validation rejects it)", async () => {
      const res = await request(app).post("/api/auth/signup").send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it("returns 400 when email format is invalid", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        email: "not-valid",
        password: "secure123",
        displayName: "Test User",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 400 when password is too short", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        email: "test@example.com",
        password: "hi",
        displayName: "Test User",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 400 when user already exists", async () => {
      // Tell the mocked User.findOne to pretend a user was found
      vi.mocked(User.findOne).mockResolvedValueOnce({
        _id: "existing-id",
        email: "test@example.com",
      } as never);

      const res = await request(app).post("/api/auth/signup").send({
        email: "test@example.com",
        password: "secure123",
        displayName: "Test User",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("User already exists");
    });

    it("returns 201 with token on successful signup", async () => {
      // No existing user found
      vi.mocked(User.findOne).mockResolvedValueOnce(null);

      // User.create returns the new user object
      vi.mocked(User.create).mockResolvedValueOnce({
        _id: "new-user-id",
        email: "new@example.com",
        displayName: "New User",
      } as never);

      const res = await request(app).post("/api/auth/signup").send({
        email: "new@example.com",
        password: "secure123",
        displayName: "New User",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe("mock_jwt_token_abc");
      expect(res.body.data.user.email).toBe("new@example.com");
      expect(res.body.data.user.displayName).toBe("New User");
    });
  });

  // =========================================================================
  // POST /api/auth/login
  // =========================================================================
  describe("POST /api/auth/login", () => {
    it("returns 400 when request body is empty (validation rejects it)", async () => {
      const res = await request(app).post("/api/auth/login").send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 400 when email is invalid", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "not-valid",
        password: "secure123",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 400 when user does not exist", async () => {
      vi.mocked(User.findOne).mockResolvedValueOnce(null);

      const res = await request(app).post("/api/auth/login").send({
        email: "nobody@example.com",
        password: "secure123",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("returns 400 when password is wrong", async () => {
      vi.mocked(User.findOne).mockResolvedValueOnce({
        _id: "user-id",
        email: "test@example.com",
        password: "hashed_password",
      } as never);

      // bcrypt.compare returns false → password mismatch
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrong-password",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("returns 200 with token on valid credentials", async () => {
      vi.mocked(User.findOne).mockResolvedValueOnce({
        _id: "user-id",
        email: "test@example.com",
        displayName: "Test User",
        password: "hashed_password",
      } as never);

      // bcrypt.compare returns true → password matches
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "correct-password",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe("mock_jwt_token_abc");
      expect(res.body.data.user.email).toBe("test@example.com");
    });
  });

  // =========================================================================
  // GET /api/auth/me
  // =========================================================================
  describe("GET /api/auth/me", () => {
    it("returns 401 when no Authorization header is provided", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("returns 401 when token is invalid", async () => {
      // jwt.verify throws an error → token is invalid
      vi.mocked(jwt.verify).mockImplementationOnce(() => {
        throw new Error("Invalid token");
      });

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer bad-token");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid token");
    });

    it("returns 404 when token is valid but user not found in DB", async () => {
      // jwt.verify succeeds and returns decoded payload
      vi.mocked(jwt.verify).mockReturnValueOnce({
        userId: "deleted-user-id",
      } as never);

      // User.findById().select() returns null
      vi.mocked(User.findById).mockReturnValueOnce({
        select: vi.fn().mockResolvedValueOnce(null),
      } as never);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("returns 200 with user profile when token is valid", async () => {
      vi.mocked(jwt.verify).mockReturnValueOnce({
        userId: "real-user-id",
      } as never);

      vi.mocked(User.findById).mockReturnValueOnce({
        select: vi.fn().mockResolvedValueOnce({
          _id: "real-user-id",
          email: "me@example.com",
          displayName: "Real User",
          avatar: null,
        }),
      } as never);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("me@example.com");
      expect(res.body.data.displayName).toBe("Real User");
    });
  });
});
