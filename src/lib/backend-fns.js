// Server functions that stand in for the Base44 REST API. The browser client (src/api/base44Client.js)
// calls these; identity comes from the Neon Auth session cookie, data from Lakebase Postgres.
import { createServerFn } from "@tanstack/react-start";
import { entityStore, newId } from "@/lib/db.server";
import { signFileToken } from "@/lib/file-links.server";
import { sessionUser } from "@/lib/neon-auth.server";
import { readLangCookie } from "@/lib/lang-cookie.server";
import { query } from "@/lib/pg.server";
import { getRealtime, recordChangesQuery } from "@/lib/realtime.server";

const ENTITY_OPS = new Set(["list", "filter", "get", "count", "create", "bulkCreate", "update", "updateMany", "delete", "deleteMany"]);
const READ_OPS = new Set(["list", "filter", "get", "count"]);
// Entities a signed-in member may write straight from the browser; every other write goes through
// the checked handlers in server-fns.js.
const CLIENT_WRITABLE = new Set(["Notification"]);
// Never written from the browser, not even by admins: membership changes go through the
// server actions in server-fns.js (invite, vote, role change, remove), which enforce rule 9.
const SERVER_ONLY = new Set(["Member"]);

const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const pass = (d) => d;

async function requireCaller() {
  const user = await sessionUser();
  if (!user) throw fail("Unauthorized", 401);
  return user;
}

async function isFundAdmin(user) {
  if (user.role === "admin") return true;
  // Member emails are unique case-insensitively (app_records_member_email_uniq), so compare the same way.
  const members = await entityStore("Member").list({ limit: 1000 });
  const email = String(user.email || "").trim().toLowerCase();
  return members.some(
    (m) => String(m.user_email || "").trim().toLowerCase() === email && m.fund_role === "super_admin",
  );
}

/* ── entities ── */

export const entityCall = createServerFn({ method: "POST" })
  .validator(pass)
  .handler(async ({ data }) => {
    const { entity, op, args = [] } = data || {};
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(entity || "") || !ENTITY_OPS.has(op) || !Array.isArray(args)) throw fail("Bad request");
    const user = await requireCaller();
    if (!READ_OPS.has(op) && SERVER_ONLY.has(entity)) throw fail("Not allowed", 403);
    if (!READ_OPS.has(op) && !CLIENT_WRITABLE.has(entity) && !(await isFundAdmin(user))) throw fail("Not allowed", 403);
    return entityStore(entity, async () => user)[op](...args);
  });

/* ── auth ── */

// Signed out is a normal answer here (every page load asks), not an error: return null.
export const authMe = createServerFn({ method: "POST" }).handler(async () => (await sessionUser()) ?? null);

// Asked only after an email + password sign-in fails, so the login page can say *why*:
// no account with this email, or an account that signs in with Google and has no password.
export const loginEmailStatus = createServerFn({ method: "POST" })
  .validator(pass)
  .handler(async ({ data }) => {
    const email = String(data?.email || "").trim().toLowerCase();
    if (!email) return { registered: false, hasPassword: false };
    const { rows } = await query(
      `SELECT EXISTS (SELECT 1 FROM neon_auth.account a WHERE a."userId" = u.id AND a."providerId" = 'credential') AS has_password
         FROM neon_auth."user" u WHERE lower(u.email) = $1 LIMIT 1`,
      [email],
    );
    return { registered: rows.length > 0, hasPassword: !!rows[0]?.has_password };
  });

/* ── preferences (stored in Neon, per user) ── */

// The language cookie, so the server renders the first paint in the chosen language.
export const getLangCookie = createServerFn({ method: "GET" }).handler(async () => readLangCookie());

export const getMyPrefs = createServerFn({ method: "POST" }).handler(async () => {
  const user = await sessionUser();
  if (!user) return null;
  const { rows } = await query("SELECT lang FROM app_user_prefs WHERE user_id = $1", [user.id]);
  return { lang: rows[0]?.lang ?? null };
});

export const saveMyLang = createServerFn({ method: "POST" })
  .validator(pass)
  .handler(async ({ data }) => {
    const user = await requireCaller();
    const lang = data?.lang === "en" ? "en" : "ml";
    await query(
      `INSERT INTO app_user_prefs (user_id, lang) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET lang = EXCLUDED.lang, updated_date = now()`,
      [user.id, lang],
    );
    return { lang };
  });

/* ── users ── */

export const inviteUser = createServerFn({ method: "POST" })
  .validator(pass)
  .handler(async ({ data }) => {
    const user = await requireCaller();
    const email = String(data?.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw fail("Enter a valid email address");
    await query(
      `INSERT INTO app_invites (email, role, invited_by) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, invited_by = EXCLUDED.invited_by`,
      [email, data?.role === "admin" ? "admin" : "user", user.email],
    );
    return { ok: true };
  });

/* ── files ── */

export const uploadPrivateFile = createServerFn({ method: "POST" })
  .validator(pass)
  .handler(async ({ data }) => {
    const user = await requireCaller();
    const { name = "file", type = "application/octet-stream", base64 } = data || {};
    if (!base64) throw fail("No file");
    const bytes = Buffer.from(base64, "base64");
    if (bytes.length > 10 * 1024 * 1024) throw fail("File too large (max 10 MB)");
    const id = newId();
    await query(
      "INSERT INTO app_files (id, name, content_type, size, owner_id, bytes) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, String(name).slice(0, 200), String(type).slice(0, 100), bytes.length, user.id, bytes],
    );
    return { file_uri: `neon://${id}` };
  });

export const createFileSignedUrl = createServerFn({ method: "POST" })
  .validator(pass)
  .handler(async ({ data }) => {
    await requireCaller();
    const id = String(data?.file_uri || "").replace(/^neon:\/\//, "");
    const { rowCount } = await query("SELECT 1 FROM app_files WHERE id = $1", [id]);
    if (!rowCount) throw fail("File not found", 404);
    const expires = Date.now() + Math.min(Number(data?.expires_in) || 900, 3600) * 1000;
    return { signed_url: `/api/files/${signFileToken(id, expires)}` };
  });

/* ── realtime ── */

// Seals the record-change live query for a signed-in user. Called on mount and by useLiveQuery to renew.
export const sealRecordChanges = createServerFn({ method: "POST" }).handler(async () => {
  await requireCaller();
  return getRealtime().seal({ query: recordChangesQuery() });
});
