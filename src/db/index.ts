import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionUrl = process.env.DATABASE_URL;

if (!connectionUrl) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const poolConnection = mysql.createPool(connectionUrl);

export const db = drizzle(poolConnection, { schema, mode: "default" });
