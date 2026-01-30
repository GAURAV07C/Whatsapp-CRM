import { config } from "dotenv";
config();



import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";

async function initDB() {
  // MySQL connection using URL
<<<<<<< HEAD
  const connectionUrl = process.env.MYSQL_URL!
=======
  let connectionUrl = process.env.MYSQL_URL!
  
  // Remove ssl-mode parameter as mysql2 doesn't support it in URL
  // and add proper SSL config
  connectionUrl = connectionUrl.replace(/[?&]ssl-mode=[^&]*/gi, '');
>>>>>>> 1fbea6a6a24b8c64fb69d71e6b7da89d3b68fc9c

  const connection = await mysql.createConnection({
    uri: connectionUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  console.log("✅ Database connected successfully!");

  const db = drizzle(connection, { schema, mode: "default" });
  return db;
}

export const db = await initDB();
