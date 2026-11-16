// Lakebase Postgres on Neon. The app runs as a long-lived Node server, so it uses node-postgres (`pg`)
// with one shared pool over the pooled connection string (DATABASE_URL, the `-pooler` host).
import pg from "pg";
import { requireEnv } from "@/lib/env.server";

let pool;

export function getPool() {
  if (!pool) {
    pool = new pg.Pool({
      // Neon URLs say sslmode=require; verify-full keeps the same checks without pg's warning.
      connectionString: requireEnv("DATABASE_URL").replace("sslmode=require", "sslmode=verify-full"),
      max: 10,
    });
    // An idle connection dropping (e.g. compute scaled to zero) must not crash the server.
    pool.on("error", (error) => console.error("[pg] idle client error", error));
  }
  return pool;
}

export const query = (text, params) => getPool().query(text, params);

export function databaseName() {
  return new URL(requireEnv("DATABASE_URL")).pathname.replace(/^\//, "") || "neondb";
}
