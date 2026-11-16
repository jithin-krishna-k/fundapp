import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_bM82oyUWdSZA@ep-icy-truth-aom43be3.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full",
});

const query = async (text, params) => pool.query(text, params);

const main = async () => {
  try {
    // Check the user's language preference
    const { rows } = await query("SELECT * FROM app_user_prefs");
    console.log("app_user_prefs:", rows);
    
    // Check members to see user languages
    const { rows: members } = await query("SELECT * FROM app_records WHERE entity = 'Member'");
    console.log("Members:", members.length);
    
    // Check user 6afb0bcfac759c0ff3654447 (super admin)
    const { rows: user } = await query("SELECT data FROM app_records WHERE entity = 'Member' AND id = '6afb0bcfac759c0ff3654447'");
    if (user[0]) {
      console.log("Super admin data:", user[0]);
    }
    
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
};

main();