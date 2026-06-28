require('dotenv').config({ path: 'src/.env' });
const examModel = require('./src/models/exam.model.js');
const aiService = require('./src/services/aiService.js');
const db = examModel.db;

async function run() {
  try {
    const userId = 1;
    const examType = 'IELTS';
    const contextData = {};

    console.log("Creating exam...");
    const exam = await examModel.createExam(userId, examType, {
      title: 'IELTS Mock',
      title_bn: 'আইইএলটিএস মক',
      lesson_id: null,
      chapter_id: null,
      total_marks: 0,
      time_limit_seconds: 1200,
      difficulty_level: 3,
    });
    console.log("Exam created with ID:", exam.id);

    console.log("Generating questions...");
    const rawQuestions = await aiService.generateExamQuestions('IELTS standard vocabulary. Everyday topics suitable for IELTS Speaking band 4-6.', true);

    if (!rawQuestions || rawQuestions.length === 0) {
      console.log("Failed to generate questions.");
      return;
    }
    
    // Simulate attachListeningAudio
    const questionsWithAudio = rawQuestions; // skipping actual TTS to save time and API

    const totalMarks = questionsWithAudio.reduce((sum, q) => sum + (q.marks || 1), 0);

    console.log("Inserting questions...");
    await examModel.insertQuestions(exam.id, questionsWithAudio);

    console.log("Updating exam status to READY...");
    await db.query_executor(
      `UPDATE exams SET status = 'READY', total_marks = $1 WHERE id = $2`,
      [totalMarks, exam.id]
    );

    console.log("Success! Exam ready.");
  } catch(e) {
    console.error("Crash during flow:", e);
  }
}
run();
