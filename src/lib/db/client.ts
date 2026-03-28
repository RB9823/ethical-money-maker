import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { bootstrapDatabase } from "@/lib/db/bootstrap";
import { seedDatabase } from "@/lib/db/seed";
import * as schema from "@/lib/db/schema";

const globalForDb = globalThis as typeof globalThis & {
  __ethicalMoneyMakerDb?: ReturnType<typeof drizzle<typeof schema>>;
};

function resolveDatabasePath() {
  const configured = process.env.DATABASE_URL?.trim();

  if (!configured) {
    return path.join(process.cwd(), "data", "ethical-money-maker.db");
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

  bootstrapDatabase(sqlite);
  seedDatabase(sqlite);

  return drizzle(sqlite, { schema });
}

export const db = globalForDb.__ethicalMoneyMakerDb ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__ethicalMoneyMakerDb = db;
}
