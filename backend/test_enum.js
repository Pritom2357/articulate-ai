require('dotenv').config({ path: 'src/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_cCifDhlx8N2A@ep-billowing-breeze-aq5qtnja-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function run() {
  try {
    const res = await pool.query("SELECT unnest(enum_range(NULL::exam_type)) AS enum_value;");
    console.log(res.rows);
  } catch (err) {
    console.error('DB Error:', err.message);
  } finally {
    pool.end();
  }
}
run();
