// One-off fix: contribution weeks were saved one day early (Sunday instead of Monday)
// because isoDate() used UTC, which moves Indian local midnight to the previous day.
// Shifts week_start / week_end / due_date / week_label forward one day on Contribution
// records whose week_start falls on a Sunday.
//
//   node scripts/fix-week-start.mjs          → dry run, prints what would change
//   node scripts/fix-week-start.mjs --apply  → applies it in one transaction
import fs from "node:fs";
import pg from "pg";

for (const f of [".env.local", ".env"]) if (fs.existsSync(f)) process.loadEnvFile(f);
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const apply = process.argv.includes("--apply");

const shift = (day) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "")) return day;
  const [y, m, d] = day.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
};

const client = new pg.Client({ connectionString: url.replace("sslmode=require", "sslmode=verify-full") });
await client.connect();
try {
  const { rows } = await client.query(
    `SELECT id, data FROM app_records
      WHERE entity = 'Contribution'
        AND data->>'week_start' ~ '^\\d{4}-\\d{2}-\\d{2}$'
        AND extract(dow FROM (data->>'week_start')::date) = 0`
  );
  const weeks = new Map();
  for (const r of rows) weeks.set(r.data.week_start, (weeks.get(r.data.week_start) || 0) + 1);
  console.log(`${rows.length} contribution record(s) start on a Sunday:`);
  for (const [week, count] of [...weeks].sort()) console.log(`  ${week} → ${shift(week)}  (${count} record(s))`);

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to update them.");
  } else if (rows.length) {
    await client.query("BEGIN");
    for (const r of rows) {
      const d = r.data;
      const next = {
        ...d,
        week_start: shift(d.week_start),
        week_end: shift(d.week_end),
        due_date: shift(d.due_date),
        week_label: `${shift(d.week_start)} → ${shift(d.week_end)}`,
      };
      await client.query("UPDATE app_records SET data = $2, updated_date = now() WHERE id = $1", [r.id, next]);
    }
    await client.query("COMMIT");
    console.log(`\nUpdated ${rows.length} record(s).`);
  }
} catch (err) {
  if (apply) await client.query("ROLLBACK").catch(() => {});
  throw err;
} finally {
  await client.end();
}
