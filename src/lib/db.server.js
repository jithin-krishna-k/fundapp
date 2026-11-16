// The entity API the app code uses (list / filter / get / create / bulkCreate / update / updateMany /
// delete / count), backed by Lakebase Postgres. Each record is a JSON document in app_records.
import { randomUUID } from "node:crypto";
import { query } from "@/lib/pg.server";

export const newId = () => randomUUID().replace(/-/g, "").slice(0, 24);

const toRecord = (row) => ({
  ...row.data,
  id: row.id,
  created_date: row.created_date instanceof Date ? row.created_date.toISOString() : row.created_date,
  updated_date: row.updated_date instanceof Date ? row.updated_date.toISOString() : row.updated_date,
  created_by: row.created_by,
});

const SYSTEM = new Set(["id", "created_date", "updated_date", "created_by"]);
const stripSystem = (data) => Object.fromEntries(Object.entries(data || {}).filter(([k]) => !SYSTEM.has(k)));

/* ── query helpers (subset of the Base44 / Mongo-style query language) ── */

function matches(rec, cond) {
  if (!cond) return true;
  return Object.entries(cond).every(([key, c]) => {
    const value = rec[key];
    if (c && typeof c === "object" && !Array.isArray(c)) {
      return Object.entries(c).every(([op, arg]) => {
        switch (op) {
          case "$in": return arg.includes(value);
          case "$nin": return !arg.includes(value);
          case "$ne": return value !== arg;
          case "$eq": return value === arg;
          case "$gt": return value > arg;
          case "$gte": return value >= arg;
          case "$lt": return value < arg;
          case "$lte": return value <= arg;
          case "$exists": return arg ? value !== undefined && value !== null : value === undefined || value === null;
          default: return false;
        }
      });
    }
    return value === c;
  });
}

// Plain equality conditions on data fields go to Postgres (jsonb containment, GIN-indexed).
function containment(cond) {
  const eq = {};
  for (const [k, v] of Object.entries(cond || {})) {
    if (SYSTEM.has(k)) continue;
    if (v === null || ["string", "number", "boolean"].includes(typeof v)) eq[k] = v;
  }
  return eq;
}

function sortRecords(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    if (x === y) return 0;
    if (x === undefined || x === null) return 1;
    if (y === undefined || y === null) return -1;
    const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
    return desc ? -cmp : cmp;
  });
}

// Accepts both SDK call styles: list({ sort, limit, skip }) and list(sort, limit, skip).
function opts(a, b, c) {
  if (a && typeof a === "object") return { sort: a.sort, limit: a.limit, skip: a.skip };
  return { sort: a, limit: b, skip: c };
}

function page(rows, { sort, limit, skip }) {
  let out = sortRecords(rows, sort);
  if (skip) out = out.slice(skip);
  if (limit) out = out.slice(0, limit);
  return out;
}

function applyUpdate(data, patch) {
  const next = { ...data };
  if (patch && (patch.$set || patch.$unset || patch.$inc)) {
    Object.assign(next, stripSystem(patch.$set));
    for (const k of Object.keys(patch.$unset || {})) delete next[k];
    for (const [k, v] of Object.entries(patch.$inc || {})) next[k] = (Number(next[k]) || 0) + v;
  } else {
    Object.assign(next, stripSystem(patch));
  }
  return next;
}

const notFound = (name, id) => Object.assign(new Error(`${name} ${id} not found`), { status: 404 });

async function select(entity, cond) {
  const { rows } = await query(
    "SELECT id, data, created_by, created_date, updated_date FROM app_records WHERE entity = $1 AND data @> $2::jsonb",
    [entity, JSON.stringify(containment(cond))],
  );
  return rows.map(toRecord).filter((r) => matches(r, cond));
}

// `actor` resolves to the signed-in user (or null) and is recorded as created_by.
export function entityStore(entity, actor = async () => null) {
  const createdBy = async () => (await actor())?.email ?? null;

  async function insertMany(items) {
    if (!items.length) return [];
    const by = await createdBy();
    const ids = items.map(() => newId());
    const { rows } = await query(
      `INSERT INTO app_records (id, entity, data, created_by)
       SELECT unnest($1::text[]), $2, unnest($3::jsonb[]), $4
       RETURNING id, data, created_by, created_date, updated_date`,
      [ids, entity, items.map((d) => JSON.stringify(stripSystem(d))), by],
    );
    const byId = new Map(rows.map((r) => [r.id, toRecord(r)]));
    return ids.map((id) => byId.get(id));
  }

  return {
    list: async (a, b, c) => page(await select(entity), opts(a, b, c)),
    filter: async (cond, a, b, c) => page(await select(entity, cond), opts(a, b, c)),
    count: async (cond) => (await select(entity, cond)).length,
    get: async (id) => {
      const { rows } = await query(
        "SELECT id, data, created_by, created_date, updated_date FROM app_records WHERE entity = $1 AND id = $2",
        [entity, id],
      );
      if (!rows[0]) throw notFound(entity, id);
      return toRecord(rows[0]);
    },
    create: async (data) => (await insertMany([data]))[0],
    bulkCreate: async (items) => insertMany(items || []),
    update: async (id, patch) => {
      const { rows } = await query("SELECT data FROM app_records WHERE entity = $1 AND id = $2", [entity, id]);
      if (!rows[0]) throw notFound(entity, id);
      const { rows: out } = await query(
        `UPDATE app_records SET data = $3::jsonb, updated_date = now() WHERE entity = $1 AND id = $2
         RETURNING id, data, created_by, created_date, updated_date`,
        [entity, id, JSON.stringify(applyUpdate(rows[0].data, patch))],
      );
      return toRecord(out[0]);
    },
    updateMany: async (cond, patch) => {
      const targets = await select(entity, cond);
      for (const t of targets) {
        await query("UPDATE app_records SET data = $3::jsonb, updated_date = now() WHERE entity = $1 AND id = $2", [
          entity,
          t.id,
          JSON.stringify(applyUpdate(stripSystem(t), patch)),
        ]);
      }
      return { updated: targets.length };
    },
    delete: async (id) => {
      const { rowCount } = await query("DELETE FROM app_records WHERE entity = $1 AND id = $2", [entity, id]);
      return { success: rowCount > 0 };
    },
    deleteMany: async (cond) => {
      const ids = (await select(entity, cond)).map((r) => r.id);
      if (ids.length) await query("DELETE FROM app_records WHERE entity = $1 AND id = ANY($2::text[])", [entity, ids]);
      return { deleted: ids.length };
    },
  };
}
