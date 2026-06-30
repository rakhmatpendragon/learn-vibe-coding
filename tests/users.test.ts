import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/index";
import { clearDatabase } from "./setup";
import { registerUser } from "../src/service/users-service";

describe("Users API", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("GET /users should return empty array when database is empty", async () => {
    const response = await app.handle(new Request("http://localhost/users"));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });

  it("GET /users should return list of users when database has data", async () => {
    await registerUser("Test User", "test@example.com", "password123");
    
    const response = await app.handle(new Request("http://localhost/users"));
    expect(response.status).toBe(200);
    const data: any = await response.json();
    expect(data.length).toBe(1);
    expect(data[0].name).toBe("Test User");
    expect(data[0].email).toBe("test@example.com");
  });
});
