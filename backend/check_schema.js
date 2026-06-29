require('dotenv').config({ path: 'src/.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    // Check if vw_user_chapter_progress view exists
    const viewCheck = await pool.query(`SELECT viewname FROM pg_views WHERE viewname = 'vw_user_chapter_progress';`);
    console.log('View vw_user_chapter_progress exists:', viewCheck.rows.length > 0);

    // Check user_lesson_progress table
    const tableCheck = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'user_lesson_progress' LIMIT 10;`);
    console.log('user_lesson_progress columns:', tableCheck.rows.map(r => r.column_name));

    // Check exams table columns
    const examCols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'exams' ORDER BY ordinal_position;`);
    console.log('exams columns:', examCols.rows.map(r => r.column_name));
    
    // Check exam_answers columns
    const aCols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'exam_answers' ORDER BY ordinal_position;`);
    console.log('exam_answers columns:', aCols.rows.map(r => r.column_name));

  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}
run();
