import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/index";
import { clearDatabase } from "./setup";
import { registerUser } from "../src/service/users-service";
import { db } from "../src/db";
import { sessions } from "../src/db/schema";

describe("Current User API", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("GET /api/v1/users/current", () => {
    it("should return user profile with valid token", async () => {
      const user = await registerUser("Bob", "bob@example.com", "password123");
      const token = "bob-token";
      await db.insert(sessions).values({ token, userId: user.id });

      const response = await app.handle(new Request("http://localhost/api/v1/users/current", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      }));
      expect(response.status).toBe(200);
      const data: any = await response.json();
      expect(data.data.email).toBe("bob@example.com");
      expect(data.data.name).toBe("Bob");
    });

    it("should return 401 without token", async () => {
      const response = await app.handle(new Request("http://localhost/api/v1/users/current", {
        method: "GET"
      }));
      expect(response.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const response = await app.handle(new Request("http://localhost/api/v1/users/current", {
        method: "GET",
        headers: { "Authorization": "Bearer invalid-token" }
      }));
      expect(response.status).toBe(401);
    });
  });
});
