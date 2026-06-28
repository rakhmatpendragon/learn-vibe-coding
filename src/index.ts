import { Elysia } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoute, usersRouteV2, currentUserRoute } from "./routes/users-route";

const app = new Elysia()
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        error: "VALIDATION_ERROR",
        message: error.message,
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
