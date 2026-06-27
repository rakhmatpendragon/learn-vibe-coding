import { Elysia, t } from "elysia";
import { registerUser, loginUser, logoutUser, loginUserV2 } from "../service/users-service";

export const usersRoute = new Elysia({ prefix: "/api/v1/auth" })
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        const user = await registerUser(body.name, body.email, body.password);
        set.status = 201;
        return {
          message: "User registered successfully",
          data: user,
        };
      } catch (error: any) {
        if (error.code === 400 && error.error === "EMAIL_ALREADY_EXISTS") {
          set.status = 400;
          return {
            message: error.message,
            error: error.error,
            code: 400,
          };
        }
        set.status = 500;
        return { message: "Internal server error" };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const user = await loginUser(body.email, body.password);
        set.status = 200;
        return {
          message: "User logged in successfully",
          data: user,
        };
      } catch (error: any) {
        if (error.code === 404 && error.error === "USER_NOT_FOUND") {
          set.status = 404;
          return {
            message: error.message,
            error: error.error,
            code: 404,
          };
        }
        set.status = 500;
        return { message: "Internal server error" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
    }
  )
  .post("/logout", async ({ set }) => {
    try {
      // In a real app we'd get userId from auth middleware context, e.g. JWT payload
      // For this implementation, we will just return success as specified
      set.status = 200;
      return {
        message: "User logged out successfully",
      };
    } catch (error: any) {
      set.status = 500;
      return { message: "Internal server error" };
    }
  });

export const usersRouteV2 = new Elysia({ prefix: "/api/v2/auth" })
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const token = await loginUserV2(body.email, body.password);
        set.status = 200;
        return {
          data: token,
        };
      } catch (error: any) {
        if (error.code === 404 && error.error === "USER_NOT_FOUND") {
          set.status = 404;
          return {
            message: error.message,
            error: error.error,
            code: 404,
          };
        }
        set.status = 500;
        return { message: "Internal server error" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
    }
  );
