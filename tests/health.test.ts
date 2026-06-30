import { describe, it, expect } from "bun:test";
import { app } from "../src/index";

describe("Root & Health API", () => {
  it("GET / should return Welcome to Bun Elysia API", async () => {
    const response = await app.handle(new Request("http://localhost/"));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Welcome to Bun Elysia API");
  });

  it("GET /health should return status OK", async () => {
    const response = await app.handle(new Request("http://localhost/health"));
    expect(response.status).toBe(200);
    const data: any = await response.json();
    expect(data.status).toBe("OK");
    expect(typeof data.time).toBe("string");
  });
});
