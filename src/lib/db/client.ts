import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { bootstrapDatabase } from "@/lib/db/bootstrap";
import { seedDatabase } from "@/lib/db/seed";
import * as schema from "@/lib/db/schema";

const globalForDb = globalThis as typeof globalThis & {
  __hydeDb?: ReturnType<typeof drizzle<typeof schema>>;
};

function resolveDatabasePath() {
  const configured = process.env.DATABASE_URL?.trim();
  const dataDir = process.env.HYDE_DATA_DIR?.trim();

  if (!configured) {
    if (dataDir) {
      return path.join(dataDir, "hyde.db");
    }

    if (process.env.RAILWAY_ENVIRONMENT && fs.existsSync("/data")) {
      return "/data/hyde.db";
    }

    return path.join(process.cwd(), "data", "hyde.db");
  }

  if (configured.startsWith("file:")) {
    return configured.replace(/^file:/, "");
  }

  if (configured.startsWith("/")) {
    return configured;
  }

  return path.join(process.cwd(), configured);
}

function createDatabase() {
  const databasePath = resolveDatabasePath();
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");

  bootstrapDatabase(sqlite);
  seedDatabase(sqlite);

  return drizzle(sqlite, { schema });
}

function getOrCreateDb() {
  if (!globalForDb.__hydeDb) {
    globalForDb.__hydeDb = createDatabase();
  }

  return globalForDb.__hydeDb;
}

type DrizzleDatabase = ReturnType<typeof drizzle<typeof schema>>;

export const db = new Proxy({} as DrizzleDatabase, {
  get(_target, property, receiver) {
    const instance = getOrCreateDb();
    const value = Reflect.get(instance, property, receiver);

    return typeof value === "function" ? value.bind(instance) : value;
  },
});
