import { query } from "@/lib/pg.server";
const { rows } = await query("SELECT id, entity, data FROM app_records WHERE entity = \$1", ["User"]);
console.log(JSON.stringify(rows, null, 2));