import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_bM82oyUWdSZA@ep-icy-truth-aom43be3.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full",
});

const query = async (text, params) => pool.query(text, params);

const main = async () => {
  try {
    // Check app_user_prefs table
    const { rows } = await query("SELECT * FROM app_user_prefs");
    console.log("app_user_prefs:", rows);
    
    // Check all records
    const { rows: allRecords } = await query("SELECT * FROM app_records WHERE entity = 'Member'");
    console.log("Members count:", allRecords.length);
    
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
};

main();