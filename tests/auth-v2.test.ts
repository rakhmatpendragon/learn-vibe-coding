import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/index";
import { clearDatabase } from "./setup";
import { registerUser } from "../src/service/users-service";
import { db } from "../src/db";
import { sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("Auth V2 API", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("POST /api/v2/auth/login", () => {
    it("should login and create new session", async () => {
      const user = await registerUser("Jane", "jane@example.com", "password123");
      const payload = { email: "jane@example.com", password: "password123" };
      
      const response = await app.handle(new Request("http://localhost/api/v2/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      
      expect(response.status).toBe(200);
      const data: any = await response.json();
      expect(typeof data.data).toBe("string"); // Token should be string

      // Verify token is in DB
      const sessionList = await db.select().from(sessions).where(eq(sessions.userId, user.id));
      expect(sessionList.length).toBe(1);
      expect(sessionList[0].token).toBe(data.data);
    });

    it("should enforce single active session by deleting old ones", async () => {
      const user = await registerUser("Jane", "jane@example.com", "password123");
      await db.insert(sessions).values({ token: "old-token", userId: user.id });

      const payload = { email: "jane@example.com", password: "password123" };
      const response = await app.handle(new Request("http://localhost/api/v2/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      
      expect(response.status).toBe(200);
      const data: any = await response.json();
      
      const sessionList = await db.select().from(sessions).where(eq(sessions.userId, user.id));
      expect(sessionList.length).toBe(1);
      expect(sessionList[0].token).toBe(data.data);
      expect(sessionList[0].token).not.toBe("old-token");
    });

    it("should return 404 for non-existent user", async () => {
      const payload = { email: "wrong@example.com", password: "password123" };
      const response = await app.handle(new Request("http://localhost/api/v2/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      expect(response.status).toBe(404);
    });

    it("should return 404 for wrong password", async () => {
      await registerUser("Jane", "jane@example.com", "password123");
      const payload = { email: "jane@example.com", password: "wrongpassword" };
      const response = await app.handle(new Request("http://localhost/api/v2/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid email format", async () => {
      const payload = { email: "invalid-email", password: "password123" };
      const response = await app.handle(new Request("http://localhost/api/v2/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      expect(response.status).toBe(400);
    });
  });
});
