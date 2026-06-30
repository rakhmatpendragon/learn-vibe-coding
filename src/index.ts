import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoute, usersRouteV2, currentUserRoute } from "./routes/users-route";

export const app = new Elysia()
  .use(swagger({
    path: '/swagger',
    documentation: {
      info: {
        title: 'API Documentation',
        version: '1.0.0',
        description: 'Dokumentasi API untuk project learn-vibe-coding'
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  }))
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        error: "VALIDATION_ERROR",
        message: error.message,
        code: 400,
        details: error.all
      };
    }
  })
  .use(usersRoute)
  .use(usersRouteV2)
  .use(currentUserRoute)
  .get("/", () => "Welcome to Bun Elysia API")
  .get("/health", () => {
    return {
      status: "OK",
      time: new Date().toISOString(),
    };
  })
  .get("/users", async () => {
    try {
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error) {
      console.error(error);
      return { error: "Failed to fetch users" };
    }
  })
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
