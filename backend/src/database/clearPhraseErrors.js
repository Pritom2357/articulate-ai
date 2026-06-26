const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query("UPDATE phrases SET audio_url_m = NULL WHERE audio_url_m = 'ERROR'")
  .then(r => { console.log('Cleared', r.rowCount, 'error rows'); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
