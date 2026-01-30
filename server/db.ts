import { config } from "dotenv";
config();



import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";

async function initDB() {
  // MySQL connection using URL
  const connectionUrl = process.env.MYSQL_URL!


  const connection = await mysql.createConnection(connectionUrl);

  console.log("✅ Database connected successfully!");

  const db = drizzle(connection, { schema, mode: "default" });
  return db;
}

export const db = await initDB();
