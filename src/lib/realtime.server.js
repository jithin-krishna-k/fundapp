// Neon Realtime: one live query over the app's records. It returns only ids and update times, so a
// subscriber learns *that* data changed (and reloads through the normal, authorized server functions)
// without the live query itself carrying any record contents.
import { createRealtime, rawSql } from "@neon/realtime/server";
import { requireEnv } from "@/lib/env.server";
import { databaseName } from "@/lib/pg.server";

let realtime;

export function getRealtime() {
  realtime ||= createRealtime({ secret: requireEnv("NEON_REALTIME_SECRET"), db: databaseName() });
  return realtime;
}

// Read-only and deterministic, keyed by the primary key.
export const recordChangesQuery = () => rawSql(`SELECT id, entity, updated_date FROM app_records`);
