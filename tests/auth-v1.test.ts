import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/index";
import { clearDatabase } from "./setup";
import { registerUser } from "../src/service/users-service";
import { db } from "../src/db";
import { sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("Auth V1 API", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a valid user", async () => {
      const payload = { name: "John", email: "john@example.com", password: "password123" };
      const response = await app.handle(new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      expect(response.status).toBe(201);
      const data: any = await response.json();
      expect(data.message).toBe("User registered successfully");
      expect(data.data.email).toBe("john@example.com");
      expect(data.data.password).toBeUndefined();
    });

    it("should return 400 for duplicate email", async () => {
      await registerUser("John", "john@example.com", "password123");
      const payload = { name: "Jane", email: "john@example.com", password: "password123" };
      const response = await app.handle(new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      expect(response.status).toBe(400);
      const data: any = await response.json();
      expect(data.error).toBe("EMAIL_ALREADY_EXISTS");
    });

    it("should return 400 for invalid email format", async () => {
      const payload = { name: "John", email: "invalid-email", password: "password123" };
      const response = await app.handle(new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      expect(response.status).toBe(400);
    });
    
    it("should return 400 for short password", async () => {
      const payload = { name: "John", email: "john@example.com", password: "123" };
      const response = await app.handle(new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      expect(response.status).toBe(400);
    });

    it("should return 400 for missing fields", async () => {
      const payload = { email: "john@example.com" };
      const response = await app.handle(new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login with valid credentials", async () => {
      await registerUser("John", "john@example.com", "password123");
      const payload = { email: "john@example.com", password: "password123" };
      const response = await app.handle(new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      expect(response.status).toBe(200);
      const data: any = await response.json();
      expect(data.message).toBe("User logged in successfully");
    });

    it("should return 404 for non-existent user", async () => {
      const payload = { email: "wrong@example.com", password: "password123" };
      const response = await app.handle(new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      expect(response.status).toBe(404);
      const data: any = await response.json();
      expect(data.error).toBe("USER_NOT_FOUND");
    });

    it("should return 404 for wrong password", async () => {
      await registerUser("John", "john@example.com", "password123");
      const payload = { email: "john@example.com", password: "wrongpassword" };
      const response = await app.handle(new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      expect(response.status).toBe(404);
      const data: any = await response.json();
      expect(data.error).toBe("USER_NOT_FOUND");
    });

    it("should return 400 for invalid email format", async () => {
      const payload = { email: "invalid-email", password: "password123" };
      const response = await app.handle(new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("should logout successfully", async () => {
      const response = await app.handle(new Request("http://localhost/api/v1/auth/logout", {
        method: "POST"
      }));
      expect(response.status).toBe(200);
      const data: any = await response.json();
      expect(data.message).toBe("User logged out successfully");
    });
  });

  describe("DELETE /api/v1/auth/logout", () => {
    it("should logout with valid token", async () => {
      const user = await registerUser("John", "john@example.com", "password123");
      const token = "test-token";
      await db.insert(sessions).values({ token, userId: user.id });

      const response = await app.handle(new Request("http://localhost/api/v1/auth/logout", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      }));
      expect(response.status).toBe(200);
      
      const remainingSessions = await db.select().from(sessions).where(eq(sessions.token, token));
      expect(remainingSessions.length).toBe(0);
    });

    it("should return 401 without token", async () => {
      const response = await app.handle(new Request("http://localhost/api/v1/auth/logout", {
        method: "DELETE"
      }));
      expect(response.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const response = await app.handle(new Request("http://localhost/api/v1/auth/logout", {
        method: "DELETE",
        headers: { "Authorization": "Bearer invalid-token" }
      }));
      expect(response.status).toBe(401);
    });
  });
});
