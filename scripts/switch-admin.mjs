// One-off: make jithinkrishna526@gmail.com the fund admin (with a new password) and remove
// the jithin.krishna@bizpole.in login. The old member record is marked inactive (like the
// app's own "Remove member"), so its contributions, loans and audit history stay intact.
//
//   node scripts/switch-admin.mjs          → dry run
//   node scripts/switch-admin.mjs --apply  → apply in one transaction
import fs from "node:fs";
import pg from "pg";
import { hashPassword } from "better-auth/crypto";

for (const f of [".env.local", ".env"]) if (fs.existsSync(f)) process.loadEnvFile(f);
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const apply = process.argv.includes("--apply");

const NEW_ADMIN = "jithinkrishna526@gmail.com";
const OLD_ADMIN = "jithin.krishna@bizpole.in";
const NEW_PASSWORD = process.env.NEW_ADMIN_PASSWORD;
if (apply && !NEW_PASSWORD) throw new Error("Set NEW_ADMIN_PASSWORD for --apply");
const today = new Date().toISOString().slice(0, 10);

const c = new pg.Client({ connectionString: url.replace("sslmode=require", "sslmode=verify-full") });
await c.connect();
try {
  const users = (await c.query(`SELECT id, email FROM neon_auth."user" WHERE lower(email) = ANY($1)`, [[NEW_ADMIN, OLD_ADMIN]])).rows;
  const newUser = users.find((u) => u.email.toLowerCase() === NEW_ADMIN);
  const oldUser = users.find((u) => u.email.toLowerCase() === OLD_ADMIN);
  const members = (
    await c.query(`SELECT id, data FROM app_records WHERE entity = 'Member' AND lower(data->>'user_email') = ANY($1)`, [[NEW_ADMIN, OLD_ADMIN]])
  ).rows;
  const newMember = members.find((m) => m.data.user_email.toLowerCase() === NEW_ADMIN);
  const oldMember = members.find((m) => m.data.user_email.toLowerCase() === OLD_ADMIN);

  console.log("new admin login :", newUser?.id ?? "MISSING");
  console.log("new admin member:", newMember ? `${newMember.id} (${newMember.data.fund_role}, ${newMember.data.status})` : "MISSING");
  console.log("old admin login :", oldUser?.id ?? "(already gone)");
  console.log("old admin member:", oldMember ? `${oldMember.id} (${oldMember.data.fund_role}, ${oldMember.data.status})` : "(none)");
  if (!newUser || !newMember) throw new Error("The Gmail login or member record is missing; nothing changed.");

  if (!apply) {
    console.log("\nDry run. --apply will:");
    console.log(`  • ${NEW_ADMIN}: member → active + super_admin, password → new value, email marked verified`);
    console.log(`  • ${OLD_ADMIN}: member → inactive + member role (history kept); login + sessions deleted`);
    process.exit(0);
  }

  await c.query("BEGIN");

  // 1. Gmail account becomes the active super admin.
  const { removed_date, ...rest } = newMember.data;
  await c.query(`UPDATE app_records SET data = $2, updated_date = now() WHERE id = $1`, [
    newMember.id,
    { ...rest, status: "active", fund_role: "super_admin", join_date: rest.join_date || today },
  ]);

  // 2. Its password (same scrypt format Neon Auth / Better Auth writes) and a verified email.
  const hash = await hashPassword(NEW_PASSWORD);
  const updatedAccounts = await c.query(
    `UPDATE neon_auth.account SET password = $2, "updatedAt" = now() WHERE "userId" = $1 AND "providerId" = 'credential'`,
    [newUser.id, hash]
  );
  if (updatedAccounts.rowCount !== 1) throw new Error("Expected exactly one password login for the Gmail account.");
  await c.query(`UPDATE neon_auth."user" SET "emailVerified" = true, "updatedAt" = now() WHERE id = $1`, [newUser.id]);
  await c.query(`DELETE FROM neon_auth.session WHERE "userId" = $1`, [newUser.id]);

  // 3. Old Bizpole member: inactive, like the app's "Remove member"; history stays.
  if (oldMember) {
    await c.query(`UPDATE app_records SET data = $2, updated_date = now() WHERE id = $1`, [
      oldMember.id,
      { ...oldMember.data, status: "inactive", fund_role: "member", removed_date: today },
    ]);
  }

  // 4. Old Bizpole login: sessions, sign-in methods and the user itself.
  if (oldUser) {
    await c.query(`DELETE FROM neon_auth.session WHERE "userId" = $1`, [oldUser.id]);
    await c.query(`DELETE FROM neon_auth.member WHERE "userId" = $1`, [oldUser.id]);
    await c.query(`DELETE FROM neon_auth.account WHERE "userId" = $1`, [oldUser.id]);
    await c.query(`DELETE FROM neon_auth."user" WHERE id = $1`, [oldUser.id]);
  }
  await c.query(`DELETE FROM app_user_prefs WHERE user_id = $1`, [oldUser?.id ?? ""]);

  await c.query("COMMIT");
  console.log("\nDone.");
} catch (err) {
  if (apply) await c.query("ROLLBACK").catch(() => {});
  throw err;
} finally {
  await c.end();
}
