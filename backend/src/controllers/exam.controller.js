const examModel = require('../models/exam.model');
const aiService = require('../services/aiService');
const examEvaluator = require('../services/examEvaluator');
const CurriculumModel = require('../models/curriculum.model');
const ProgressModel = require('../models/progress.model');

const curriculumModel = new CurriculumModel();
const progressModel = new ProgressModel();

// ─── Helper: build rich context string for the LLM ───────────────────────────
async function buildContextText(examType, lessonId, chapterId, userId) {
  try {
    if (examType === 'LESSON' && lessonId) {
      const lessonData = await curriculumModel.getLessonById(lessonId);
      if (!lessonData) return 'General English vocabulary.';
      const words   = (lessonData.words   || []).slice(0, 30).map(w => `${w.word} (${w.bangla_meaning})`).join(', ');
      const phrases = (lessonData.phrases || []).slice(0, 10).map(p => `${p.phrase_en} (${p.phrase_bn})`).join(', ');
      return `Lesson: "${lessonData.lesson.title}"\nWords: ${words || 'none'}\nPhrases: ${phrases || 'none'}`;
    }

    if (examType === 'CHAPTER' && chapterId) {
      const lessons = await curriculumModel.getLessonsByChapterId(chapterId);
      if (!lessons || lessons.length === 0) return 'General English vocabulary.';
      let words = [], phrases = [];
      for (const lesson of lessons.slice(0, 4)) {
        const ld = await curriculumModel.getLessonById(lesson.id);
        if (ld) {
          words   = words.concat((ld.words   || []).map(w => `${w.word} (${w.bangla_meaning})`));
          phrases = phrases.concat((ld.phrases || []).map(p => `${p.phrase_en} (${p.phrase_bn})`));
        }
      }
      return `Chapter words: ${words.slice(0, 30).join(', ')}\nChapter phrases: ${phrases.slice(0, 10).join(', ')}`;
    }

    if (examType === 'PROGRESS' || examType === 'PRACTICE') {
      const weakWords = await progressModel.getUserWeakWords(userId);
      const weakList = (weakWords || []).slice(0, 15).map(w => `${w.word} (${w.bangla_meaning})`).join(', ');
      return `User's weak words needing practice: ${weakList || 'General English vocabulary'}`;
    }

    // IELTS — no context needed
    return 'IELTS standard vocabulary. Everyday topics suitable for IELTS Speaking band 4-6.';
  } catch (err) {
    console.error('buildContextText error:', err.message);
    return 'General English vocabulary.';
  }
}

// ─── Helper: generate TTS audio for LISTENING questions ──────────────────────
async function attachListeningAudio(questions) {
  for (const q of questions) {
    if (q.section === 'LISTENING') {
      try {
        const audioBuffer = await aiService.textToSpeech(q.text_en);
        q.audio_url = `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
      } catch (err) {
        console.warn(`TTS failed for "${q.text_en}":`, err.message);
        q.audio_url = null; // allow text-only fallback
      }
    }
  }
  return questions;
}

// ─── Helper: build exam title ─────────────────────────────────────────────────
function buildTitle(examType, contextData) {
  const typeLabels = {
    LESSON:   { en: 'Lesson Exam',    bn: 'লেসন পরীক্ষা' },
    CHAPTER:  { en: 'Chapter Exam',   bn: 'চ্যাপ্টার পরীক্ষা' },
    PROGRESS: { en: 'Progress Test',  bn: 'অগ্রগতি পরীক্ষা' },
    IELTS:    { en: 'IELTS Mock',     bn: 'আইইএলটিএস মক' },
    PRACTICE: { en: 'Practice Test',  bn: 'অনুশীলন পরীক্ষা' },
  };
  const label = typeLabels[examType] || { en: 'Exam', bn: 'পরীক্ষা' };
  return {
    title:    contextData?.title    || `${label.en} — ${new Date().toLocaleDateString('en-BD')}`,
    title_bn: contextData?.title_bn || `${label.bn}`,
  };
}

class ExamController {

  // POST /api/exam/generate
  generateExam = async (req, res) => {
    try {
      const userId   = req.user.id;
      const { examType, lessonId, chapterId, contextData } = req.body;

      if (!examType) {
        return res.status(400).json({ success: false, message: 'examType is required' });
      }

      const validTypes = ['LESSON', 'CHAPTER', 'PROGRESS', 'IELTS', 'PRACTICE'];
      if (!validTypes.includes(examType)) {
        return res.status(400).json({ success: false, message: `examType must be one of: ${validTypes.join(', ')}` });
      }

      // ── Prerequisite checks ──
      if (examType === 'LESSON') {
        if (!lessonId) return res.status(400).json({ success: false, message: 'lessonId is required for LESSON exam' });
        const isCompleted = await examModel.checkLessonCompleted(userId, lessonId);
        if (!isCompleted) {
          return res.status(403).json({ success: false, message: 'Complete the lesson first before taking a lesson exam.' });
        }
      }

      if (examType === 'CHAPTER') {
        if (!chapterId) return res.status(400).json({ success: false, message: 'chapterId is required for CHAPTER exam' });
        const isCompleted = await examModel.checkChapterCompleted(userId, chapterId);
        if (!isCompleted) {
          return res.status(403).json({ success: false, message: 'Complete all lessons in this chapter first.' });
        }
      }

      // ── Build title ──
      const titles = buildTitle(examType, contextData);

      // ── Create exam row (status = GENERATING) ──
      const exam = await examModel.createExam(userId, examType, {
        ...titles,
        lesson_id:        lessonId  || contextData?.lesson_id  || null,
        chapter_id:       chapterId || contextData?.chapter_id || null,
        total_marks:      0,
        time_limit_seconds: contextData?.time_limit_seconds || 1200,
        difficulty_level: contextData?.difficulty_level || 3,
      });

      // ── Gather curriculum context for LLM ──
      const contextText = await buildContextText(examType, lessonId || contextData?.lesson_id, chapterId || contextData?.chapter_id, userId);
      const isIelts     = examType === 'IELTS';

      // ── Generate questions via LLM ──
      const rawQuestions = await aiService.generateExamQuestions(contextText, isIelts);

      if (!rawQuestions || rawQuestions.length === 0) {
        await examModel.updateExamStatus(exam.id, 'FAILED');
        return res.status(500).json({ success: false, message: 'Failed to generate questions. Please try again.' });
      }

      // ── Generate TTS audio for LISTENING questions ──
      const questionsWithAudio = await attachListeningAudio(rawQuestions);

      // ── Calculate total marks ──
      const totalMarks = questionsWithAudio.reduce((sum, q) => sum + (q.marks || 1), 0);

      // ── Insert questions into DB ──
      await examModel.insertQuestions(exam.id, questionsWithAudio);

      // ── Mark exam as READY with correct total_marks ──
      await examModel.markExamReady(exam.id, totalMarks);

      // ── Fetch the final exam row to return to client ──
      const finalExamData = await examModel.getExamById(exam.id);

      return res.status(200).json({
        success:   true,
        examId:    exam.id,
        exam:      finalExamData.exam,
        questions: finalExamData.questions,
        message:   'Exam generated successfully',
      });

    } catch (error) {
      console.error('generateExam error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // GET /api/exam/:id
  getExamById = async (req, res) => {
    try {
      const { id }   = req.params;
      const userId   = req.user.id;

      const examData = await examModel.getExamById(id);

      if (!examData || !examData.exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      if (parseInt(examData.exam.user_id) !== parseInt(userId)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Auto-transition READY → IN_PROGRESS when user first opens the exam
      if (examData.exam.status === 'READY') {
        await examModel.updateExamStatus(id, 'IN_PROGRESS', { started_at: new Date() });
        examData.exam.status = 'IN_PROGRESS';
        examData.exam.started_at = new Date();
      }

      // Strip audio buffers from answer data (too large for GET)
      if (examData.answers) {
        examData.answers = examData.answers.map(a => {
          const { audio_buffer, ...rest } = a;
          return rest;
        });
      }

      return res.status(200).json({ success: true, data: examData });

    } catch (error) {
      console.error('getExamById error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // POST /api/exam/:id/submit
  submitExam = async (req, res) => {
    try {
      const { id }   = req.params;
      const userId   = req.user.id;

      // Parse answers field (JSON string or array)
      let answersArray = [];
      try {
        const raw = req.body.answers;
        answersArray = Array.isArray(raw) ? raw : JSON.parse(raw || '[]');
      } catch {
        answersArray = [];
      }

      // Map uploaded audio files back to their question answers
      if (Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files) {
          const match = file.fieldname.match(/^audio_(\d+)$/);
          if (match) {
            const questionId = parseInt(match[1]);
            let ans = answersArray.find(a => parseInt(a.question_id) === questionId);
            if (!ans) {
              ans = { question_id: questionId };
              answersArray.push(ans);
            }
            ans.audio_buffer = file.buffer;
          }
        }
      }

      // Validate ownership
      const examData = await examModel.getExamById(id);
      if (!examData?.exam || parseInt(examData.exam.user_id) !== parseInt(userId)) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      if (['EVALUATED', 'EVALUATING', 'SUBMITTED'].includes(examData.exam.status)) {
        return res.status(409).json({ success: false, message: 'Exam already submitted' });
      }

      // Save answers
      await examModel.submitAnswers(id, answersArray);

      // Mark as SUBMITTED
      await examModel.updateExamStatus(id, 'SUBMITTED');

      // Fire-and-forget background evaluation
      examEvaluator.enqueueExam(parseInt(id));

      return res.status(200).json({ success: true, message: 'Exam submitted. Evaluation in progress…' });

    } catch (error) {
      console.error('submitExam error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // GET /api/exam/:id/results
  getExamResults = async (req, res) => {
    try {
      const { id }   = req.params;
      const userId   = req.user.id;

      const examData = await examModel.getExamResults(id);

      if (!examData?.exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      if (parseInt(examData.exam.user_id) !== parseInt(userId)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (examData.exam.status === 'GENERATING' || examData.exam.status === 'READY' || examData.exam.status === 'IN_PROGRESS') {
        return res.status(200).json({ success: true, status: examData.exam.status, message: 'Exam not yet submitted' });
      }

      if (examData.exam.status === 'SUBMITTED' || examData.exam.status === 'EVALUATING') {
        return res.status(200).json({ success: true, status: examData.exam.status, message: 'Evaluation in progress, please wait…' });
      }

      // Strip audio buffers (too large to send)
      if (examData.answers) {
        examData.answers = examData.answers.map(a => {
          const { audio_buffer, ...rest } = a;
          return rest;
        });
      }

      return res.status(200).json({ success: true, data: examData });

    } catch (error) {
      console.error('getExamResults error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // GET /api/exam/history
  getExamHistory = async (req, res) => {
    try {
      const userId  = req.user.id;
      const limit   = Math.min(parseInt(req.query.limit) || 20, 100);
      const history = await examModel.getExamsByUser(userId, limit);
      return res.status(200).json({ success: true, data: history });
    } catch (error) {
      console.error('getExamHistory error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // POST /api/exam/:id/retake
  retakeExam = async (req, res) => {
    try {
      const { id }   = req.params;
      const userId   = req.user.id;

      const oldExamData = await examModel.getExamById(id);
      if (!oldExamData?.exam || parseInt(oldExamData.exam.user_id) !== parseInt(userId)) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      const oldExam = oldExamData.exam;

      // Re-use the same generation flow with the original context
      req.body = {
        examType:  oldExam.exam_type,
        lessonId:  oldExam.lesson_id,
        chapterId: oldExam.chapter_id,
        contextData: {
          title:    `${oldExam.title} (Retake)`,
          title_bn: oldExam.title_bn ? `${oldExam.title_bn} (পুনরায়)` : null,
          time_limit_seconds: oldExam.time_limit_seconds,
          difficulty_level:   oldExam.difficulty_level,
        },
      };

      return await this.generateExam(req, res);

    } catch (error) {
      console.error('retakeExam error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // GET /api/exam/answer/:answerId/audio
  getAnswerAudio = async (req, res) => {
    try {
      const { answerId } = req.params;
      const userId = req.user.id;
      
      const audioBuffer = await examModel.getAnswerAudioBuffer(answerId, userId);
      
      if (!audioBuffer) {
        return res.status(404).json({ success: false, message: 'Audio not found' });
      }
      
      // Serve the raw audio buffer (browser will auto-detect MIME usually, but webm is a safe default for MediaRecorder)
      res.set('Content-Type', 'audio/webm');
      res.send(audioBuffer);
    } catch (err) {
      console.error('getAnswerAudio error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

module.exports = new ExamController();
