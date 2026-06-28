const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_cCifDhlx8N2A@ep-billowing-breeze-aq5qtnja-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function run() {
  try {
    await pool.query(`ALTER TYPE exam_type ADD VALUE IF NOT EXISTS 'IELTS';`);
    console.log("Enum altered!");
  } catch (err) {
    console.error('DB Error:', err.message);
  } finally {
    pool.end();
  }
}
run();
