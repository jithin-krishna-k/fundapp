import { createPool } from "pg";
import { createReadStream } from "fs";

const pool = new createPool({
  connectionString: "postgresql://postgres:password@localhost:5432/neondb?sslmode=verify-full",
});

const query = (text, params) => pool.query(text, params);

const main = async () => {
  try {
    const { rows } = await query("SELECT id, entity, data FROM app_records WHERE entity = \$1", ["User"]);
    console.log("User records from app_records:");
    console.log(JSON.stringify(rows, null, 2));
    
    // Also check how many total records
    const { rowCount } = await query("SELECT COUNT(*) FROM app_records WHERE entity = \$1", ["User"]);
    console.log(`\nTotal User records: ${rowCount}`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
};

main();