// In Next.js runtime, enforce server-only import. In scripts (Node), skip.
if (process.env.NEXT_RUNTIME) {
  import("server-only").catch(() => {
    console.warn("Server-only import failed, skipping.");
  });
}
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

function createDb() {
  const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
  if (env.NODE_ENV !== "production") {
    globalForDb.conn = conn;
  }

  const client = drizzle(conn, { schema });
  if (env.NODE_ENV !== "production") {
    globalForDb.db = client;
  }

  return client;
}

type DbClient = ReturnType<typeof createDb>;

export function getDb(): DbClient {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  return createDb();
}

export const db: DbClient = new Proxy({} as DbClient, {
  get(_target, prop) {
    const client = getDb();
    const value = client[prop as keyof DbClient];
    return typeof value === "function"
      ? value.bind(client)
      : value;
  },
});
