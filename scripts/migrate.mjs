// Applies db/migrations/*.sql in order, once each. Uses the direct (unpooled) connection, as migrations should.
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

for (const f of [".env.local", ".env"]) if (fs.existsSync(f)) process.loadEnvFile(f);
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set (run `neon env pull`)");

const client = new pg.Client({ connectionString: url.replace("sslmode=require", "sslmode=verify-full") });
await client.connect();
try {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const done = new Set((await client.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name));
  const dir = path.resolve("db/migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    if (done.has(file)) continue;
    await client.query("BEGIN");
    try {
      await client.query(fs.readFileSync(path.join(dir, file), "utf8"));
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`applied ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }
  console.log(`migrations up to date (${files.length} total)`);
} finally {
  await client.end();
}
