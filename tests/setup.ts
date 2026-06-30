import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";

export const clearDatabase = async () => {
  await db.delete(sessions);
  await db.delete(users);
};
