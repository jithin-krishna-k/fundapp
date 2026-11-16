import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_bM82oyUWdSZA@ep-icy-truth-aom43be3.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full",
});

const query = async (text, params) => pool.query(text, params);

const main = async () => {
  try {
    // Query all user records from app_records
    const { rows } = await query("SELECT id, data, created_date, updated_date FROM app_records WHERE entity = \$1", ["User"]);
    console.log(`Found ${rows.length} user records:\n`);
    
    rows.forEach((row, i) => {
      console.log(`--- User ${i + 1} ---`);
      console.log(`ID: ${row.id}`);
      console.log(`Created: ${row.created_date}`);
      console.log(`Updated: ${row.updated_date}`);
      console.log(`Data:`, JSON.stringify(row.data, null, 2));
      console.log();
    });
    
    // Also get count
    const { rowCount } = await query("SELECT COUNT(*) FROM app_records WHERE entity = \$1", ["User"]);
    console.log(`Total user records in DB: ${rowCount}`);
    
    // List all entities to see what entities exist
    const { rows: allRows } = await query("SELECT DISTINCT entity FROM app_records");
    console.log(`\nAll entities in app_records:`, allRows.map(r => r.entity));
    
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
};

main();