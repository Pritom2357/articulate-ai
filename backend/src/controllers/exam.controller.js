const ExamModel = require('../models/exam.model');
const CurriculumModel = require('../models/curriculum.model');
const ProgressModel = require('../models/progress.model');
const DB_Connection = require('../database/db');
const aiService = require('../services/aiService');
const { evaluateExam } = require('../services/examEvaluator');

class ExamController {
    constructor() {
        this.examModel = new ExamModel();
        this.curriculumModel = new CurriculumModel();
        this.progressModel = new ProgressModel();
        this.db = DB_Connection.getInstance();
    }

    // Gather context data based on exam type; throws on unmet prerequisites
    async _getExamContext(userId, examType, lessonId, chapterId) {
        let contextDataStr = '';
        let title = '';
        let totalMarks = 30;

        if (examType === 'LESSON') {
            if (!lessonId) throw Object.assign(new Error('lessonId is required for LESSON exam'), { status: 400 });

            const lessonProgress = await this.db.query_executor(
                `SELECT status FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2`,
                [userId, lessonId]
            );
            if (lessonProgress.rows[0]?.status !== 'COMPLETED') {
                throw Object.assign(new Error('Complete the lesson first before taking its exam.'), { status: 403 });
            }

            const lessonData = await this.curriculumModel.getLessonById(lessonId);
            const words = lessonData.words || [];
            const phrases = lessonData.phrases || [];

            title = `Lesson Exam: ${lessonData.title}`;
            const wordList = words.slice(0, 25).map(w => `${w.word} (${w.bangla_meaning})`).join(', ');
            const phraseList = phrases.slice(0, 8).map(p => `"${p.phrase_en}"`).join(', ');
            contextDataStr = `Words: ${wordList || 'general vocabulary'}. Phrases: ${phraseList || 'none'}.`;

        } else if (examType === 'CHAPTER') {
            if (!chapterId) throw Object.assign(new Error('chapterId is required for CHAPTER exam'), { status: 400 });

            const chapterProgress = await this.db.query_executor(
                `SELECT status FROM vw_user_chapter_progress WHERE user_id = $1 AND chapter_id = $2`,
                [userId, chapterId]
            );
            if (chapterProgress.rows[0]?.status !== 'COMPLETED') {
                throw Object.assign(new Error('Complete all lessons in this chapter first.'), { status: 403 });
            }

            const chapterRes = await this.db.query_executor(
                `SELECT title FROM chapters WHERE id = $1`, [chapterId]
            );
            title = `Chapter Exam: ${chapterRes.rows[0]?.title || 'Chapter'}`;

            const lessonsData = await this.curriculumModel.getLessonsByChapterId(chapterId);
            const lessons = lessonsData.lessons || lessonsData || [];
            let allWords = [];
            for (const lesson of lessons.slice(0, 5)) {
                const lessonData = await this.curriculumModel.getLessonById(lesson.id);
                if (lessonData.words) allWords = allWords.concat(lessonData.words);
            }
            contextDataStr = `Words: ${allWords.slice(0, 35).map(w => `${w.word} (${w.bangla_meaning})`).join(', ')}.`;
            totalMarks = 40;

        } else if (examType === 'PROGRESS' || examType === 'PRACTICE') {
            title = examType === 'PROGRESS' ? 'Progress Check Exam' : 'Practice Exam';
            const weakWords = await this.progressModel.getUserWeakWords(userId);
            const wordList = (weakWords || []).slice(0, 15).map(w => w.word).join(', ');
            contextDataStr = `User's weak words to focus on: ${wordList || 'general English vocabulary'}.`;

        } else if (examType === 'IELTS') {
            title = 'IELTS Mock Exam';
            contextDataStr = 'IELTS standard general training. Topics: daily life, education, environment, health, technology.';
            totalMarks = 40;
        }

        return { contextDataStr, title, totalMarks };
    }

    generateExam = async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const { examType, lessonId, chapterId } = req.body;

            const validTypes = ['LESSON', 'CHAPTER', 'PROGRESS', 'IELTS', 'PRACTICE'];
            if (!examType || !validTypes.includes(examType)) {
                return res.status(400).json({ success: false, error: `Invalid examType. Must be one of: ${validTypes.join(', ')}` });
            }

            let context;
            try {
                context = await this._getExamContext(userId, examType, lessonId, chapterId);
            } catch (err) {
                return res.status(err.status || 403).json({ success: false, error: err.message });
            }

            // Create the exam row (status = GENERATING)
            const exam = await this.examModel.createExam(userId, examType, {
                lessonId, chapterId,
                title: context.title,
                totalMarks: context.totalMarks
            });

            // Generate questions from LLM
            let generatedData;
            try {
                generatedData = await aiService.generateExamQuestions(examType, context.contextDataStr);
            } catch (err) {
                await this.examModel.updateExamStatus(exam.id, 'FAILED');
                return res.status(500).json({ success: false, error: 'Failed to generate questions from AI. Please try again.' });
            }

            if (!generatedData?.questions?.length) {
                await this.examModel.updateExamStatus(exam.id, 'FAILED');
                return res.status(500).json({ success: false, error: 'AI returned no questions. Please try again.' });
            }

            // Generate TTS audio for all LISTENING questions
            for (const q of generatedData.questions) {
                if (q.section === 'LISTENING') {
                    try {
                        const audioBuffer = await aiService.textToSpeech(q.text_en);
                        q.audio_url = `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
                    } catch (e) {
                        console.warn(`[ExamController] TTS failed for "${q.text_en}":`, e.message);
                        q.audio_url = null; // graceful fallback
                    }
                }
            }

            // Persist all questions
            await this.examModel.insertQuestions(exam.id, generatedData.questions);

            // Return the ready exam
            const readyExam = await this.examModel.getExamById(exam.id);
            res.status(201).json({ success: true, data: readyExam });

        } catch (error) {
            console.error('[ExamController] generateExam error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    getExam = async (req, res) => {
        try {
            const data = await this.examModel.getExamById(req.params.examId);
            if (!data) return res.status(404).json({ success: false, error: 'Exam not found' });

            // Ownership check
            if (data.exam.user_id !== req.user?.id) {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }

            res.json({ success: true, data });
        } catch (error) {
            console.error('[ExamController] getExam error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    submitExam = async (req, res) => {
        try {
            const { examId } = req.params;
            const userId = req.user?.id;

            // Validate exam belongs to user and is in a submittable state
            const data = await this.examModel.getExamById(examId);
            if (!data) return res.status(404).json({ success: false, error: 'Exam not found' });
            if (data.exam.user_id !== userId) return res.status(403).json({ success: false, error: 'Access denied' });
            if (['SUBMITTED', 'EVALUATING', 'EVALUATED'].includes(data.exam.status)) {
                return res.status(409).json({ success: false, error: 'Exam already submitted' });
            }

            if (!req.body.answers) {
                return res.status(400).json({ success: false, error: 'Missing answers field' });
            }

            let answers;
            try {
                answers = JSON.parse(req.body.answers);
            } catch {
                return res.status(400).json({ success: false, error: 'answers must be valid JSON' });
            }

            // Attach uploaded audio buffers to matching answer objects
            if (req.files?.length) {
                for (const file of req.files) {
                    const match = file.fieldname.match(/^audio_(\d+)$/);
                    if (match) {
                        const qId = parseInt(match[1]);
                        const answerObj = answers.find(a => a.questionId === qId);
                        if (answerObj) answerObj.audio_buffer = file.buffer;
                    }
                }
            }

            // Format for the model
            const formattedAnswers = answers.map(a => ({
                question_id: a.questionId,
                typed_answer: a.typedAnswer || null,
                audio_buffer: a.audio_buffer || null,
                audio_url: null
            }));

            await this.examModel.submitAnswers(examId, formattedAnswers);

            // Respond immediately
            res.json({ success: true, message: 'Exam submitted successfully. Evaluation is running in the background.' });

            // Kick off background evaluation — intentionally not awaited
            evaluateExam(examId).catch(err =>
                console.error(`[ExamController] Background evaluation error for exam ${examId}:`, err)
            );

        } catch (error) {
            console.error('[ExamController] submitExam error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    getExamResults = async (req, res) => {
        try {
            const data = await this.examModel.getExamResults(req.params.examId);
            if (!data) return res.status(404).json({ success: false, error: 'Exam not found' });

            if (data.exam.user_id !== req.user?.id) {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }

            if (data.exam.status !== 'EVALUATED') {
                return res.status(202).json({
                    success: false,
                    status: data.exam.status,
                    message: 'Exam has not been evaluated yet. Please check back soon.'
                });
            }

            // Strip raw audio buffers from response
            data.answers = data.answers.map(a => {
                const { audio_buffer, ...safe } = a;
                return safe;
            });

            res.json({ success: true, data });
        } catch (error) {
            console.error('[ExamController] getExamResults error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    getExamHistory = async (req, res) => {
        try {
            const userId = req.user?.id;
            const { status, limit = 10, offset = 0 } = req.query;
            const data = await this.examModel.getExamsByUser(userId, {
                status,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            res.json({ success: true, data });
        } catch (error) {
            console.error('[ExamController] getExamHistory error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    retakeExam = async (req, res) => {
        try {
            const { examId } = req.params;
            const userId = req.user?.id;

            const oldExamRes = await this.db.query_executor(
                `SELECT * FROM exams WHERE id = $1 AND user_id = $2`,
                [examId, userId]
            );
            if (!oldExamRes.rows.length) {
                return res.status(404).json({ success: false, error: 'Exam not found' });
            }

            const oldExam = oldExamRes.rows[0];

            // Re-use original context to generate a new exam
            req.body = {
                examType: oldExam.exam_type,
                lessonId: oldExam.lesson_id,
                chapterId: oldExam.chapter_id
            };

            return this.generateExam(req, res);

        } catch (error) {
            console.error('[ExamController] retakeExam error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
}

module.exports = new ExamController();
