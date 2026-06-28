import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

export const registerUser = async (name: string, email: string, passwordInput: string) => {
  // Check if email already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (existingUser.length > 0) {
    throw { code: 400, error: "EMAIL_ALREADY_EXISTS", message: "User already exists" };
  }

  // Hash password
  const hashedPassword = await Bun.password.hash(passwordInput, { algorithm: "bcrypt" });

  // Insert new user
  const result = await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  // Get the inserted user to return
  const insertedUser = await db.select().from(users).where(eq(users.id, result[0].insertId)).limit(1);

  if (insertedUser.length === 0) {
    throw new Error("Failed to retrieve the inserted user");
  }

  const { password, ...userWithoutPassword } = insertedUser[0];
  return userWithoutPassword;
};

export const loginUser = async (email: string, passwordInput: string) => {
  // Find user by email
  const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (userList.length === 0) {
    throw { code: 404, error: "USER_NOT_FOUND", message: "User not found" };
  }

  const user = userList[0];

  // Verify password
  const isPasswordValid = await Bun.password.verify(passwordInput, user.password);
  
  if (!isPasswordValid) {
    throw { code: 404, error: "USER_NOT_FOUND", message: "User not found" }; // Or a specific 401 Unauthorized
  }

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const logoutUser = async (userId: number) => {
  // In a real application, you might invalidate a session or token here.
  // We'll verify the user exists to meet the issue's requirements.
  const userList = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (userList.length === 0) {
    throw { code: 404, error: "USER_NOT_FOUND", message: "User not found" };
  }

  return true;
};

export const loginUserV2 = async (email: string, passwordInput: string) => {
  const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (userList.length === 0) {
    throw { code: 404, error: "USER_NOT_FOUND", message: "User not found" };
  }

  const user = userList[0];
  const isPasswordValid = await Bun.password.verify(passwordInput, user.password);
  
  if (!isPasswordValid) {
    throw { code: 404, error: "USER_NOT_FOUND", message: "User not found" };
  }

  // Hapus session lama jika ada (Single Active Session)
  await db.delete(sessions).where(eq(sessions.userId, user.id));

  const token = crypto.randomUUID();

  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return token;
};

export const getCurrentUser = async (token: string) => {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (result.length === 0) {
    throw { code: 401, error: "Unauthorized" };
  }

  return result[0];
};

export const logoutSession = async (token: string) => {
  // 1. Cari token di tabel sessions
  const sessionList = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
  if (sessionList.length === 0) {
    throw { code: 401, error: "Unauthorized" };
  }

  // 2. Hapus semua token dari tabel sessions milik user tersebut (Logout All Sessions)
  const session = sessionList[0];
  await db.delete(sessions).where(eq(sessions.userId, session.userId));
  return true;
};

