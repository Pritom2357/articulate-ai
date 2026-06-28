require('dotenv').config({ path: 'src/.env' });
const examModel = require('./src/models/exam.model.js');
const aiService = require('./src/services/aiService.js');

async function run() {
  try {
    const rawQuestions = await aiService.generateExamQuestions('IELTS standard vocabulary. Everyday topics suitable for IELTS Speaking band 4-6.', true);
    
    // Simulate inserting them
    await examModel.insertQuestions(1, rawQuestions); // Assuming exam_id = 1 exists
    console.log("Success");
  } catch(e) {
    console.error("Failed:", e);
  }
}
run();
