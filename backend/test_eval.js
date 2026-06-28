require('dotenv').config({ path: 'src/.env' });
const examEvaluator = require('./src/services/examEvaluator.js');

async function run() {
  try {
    // You'd need to mock DB or ensure DB connection is ready
    const DB_Connection = require('./src/database/db.js');
    const db = DB_Connection.getInstance();
    
    // Find an exam to evaluate
    const result = await db.query_executor('SELECT id FROM exams ORDER BY id DESC LIMIT 1');
    const examId = result.rows[0].id;
    
    console.log(`Evaluating exam ${examId}`);
    await examEvaluator.evaluateExam(examId);
    console.log("Done");
  } catch (err) {
    console.error("Test Script Error:", err);
  }
}
run();
