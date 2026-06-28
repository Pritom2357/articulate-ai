require('dotenv').config({ path: 'src/.env' });
const aiService = require('./src/services/aiService.js');

async function run() {
  try {
    const rawQuestions = await aiService.generateExamQuestions('IELTS standard vocabulary. Everyday topics suitable for IELTS Speaking band 4-6.', true);
    console.log(rawQuestions);
  } catch(e) {
    console.error("Failed:", e);
  }
}
run();
