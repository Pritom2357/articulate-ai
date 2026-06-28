const examModel  = require('../models/exam.model');
const aiService  = require('./aiService');
const bus        = require('../events/eventBus');
const Events     = require('../events/eventsNames');
const ProgressModel = require('../models/progress.model');

const progressModel = new ProgressModel();

// ─── Levenshtein distance (no external dep) ──────────────────────────────────
function levenshteinDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ─── Fuzzy similarity [0, 1] ──────────────────────────────────────────────────
function fuzzyMatch(userAnswer, correctAnswer) {
  const normalize = s => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  const a = normalize(userAnswer);
  const b = normalize(correctAnswer);
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  const maxLen = Math.max(a.length, b.length);
  return 1 - levenshteinDistance(a, b) / maxLen;
}

// ─── Listening scoring thresholds ────────────────────────────────────────────
function listeningMarks(similarity, maxMarks) {
  if (similarity >= 0.85) return maxMarks;
  if (similarity >= 0.60) return maxMarks * 0.5;
  return 0;
}

// ─── Speaking scoring thresholds ─────────────────────────────────────────────
function speakingMarks(azureScore, maxMarks) {
  if (azureScore >= 85) return maxMarks;
  if (azureScore >= 70) return maxMarks * 0.75;
  if (azureScore >= 50) return maxMarks * 0.5;
  return maxMarks * 0.25;
}

// ─── XP formula per exam type ────────────────────────────────────────────────
function calcXP(examType, scorePct) {
  switch (examType) {
    case 'LESSON':   return 20 + Math.round(scorePct * 0.3);
    case 'CHAPTER':  return 30 + Math.round(scorePct * 0.5);
    case 'PROGRESS': return 20 + Math.round(scorePct * 0.5);
    case 'IELTS':    return 40 + Math.round(scorePct * 0.6);
    case 'PRACTICE': return 0; // no XP
    default:         return 20 + Math.round(scorePct * 0.3);
  }
}

// ─── Main evaluator class ─────────────────────────────────────────────────────
class ExamEvaluator {
  constructor() {
    this.queue       = [];
    this.processing  = new Set(); // guard: prevent double-evaluation
  }

  enqueueExam(examId) {
    const id = parseInt(examId);
    if (!this.processing.has(id) && !this.queue.includes(id)) {
      this.queue.push(id);
      // non-blocking
      this._processQueue().catch(err => console.error('Queue error:', err));
    }
  }

  async _processQueue() {
    while (this.queue.length > 0) {
      const examId = this.queue.shift();
      if (this.processing.has(examId)) continue;
      this.processing.add(examId);
      try {
        await this.evaluateExam(examId);
      } catch (err) {
        console.error(`Evaluator: unhandled error for exam ${examId}:`, err);
      } finally {
        this.processing.delete(examId);
      }
    }
  }

  async evaluateExam(examId) {
    console.log(`[ExamEvaluator] Starting evaluation for exam ${examId}`);

    try {
      // 1. Mark as EVALUATING
      await examModel.updateExamStatus(examId, 'EVALUATING');

      // 2. Fetch exam + questions + answers
      const examData = await examModel.getExamWithAnswers(examId);
      if (!examData?.exam) throw new Error('Exam not found');

      const { exam, questions, answers } = examData;
      let totalMarksAwarded = 0;
      let listeningObtained = 0, speakingObtained = 0;
      let listeningTotal    = 0, speakingTotal    = 0;
      const evaluatedAnswersData = [];

      // 3. Evaluate each question
      for (const question of questions) {
        const answer = answers.find(a => parseInt(a.question_id) === parseInt(question.id));

        if (question.section === 'LISTENING') listeningTotal += question.marks;
        if (question.section === 'SPEAKING')  speakingTotal  += question.marks;

        if (!answer) continue; // unanswered = 0 marks

        let marksAwarded = 0;
        let isCorrect    = false;
        let accuracyScore = null;
        let feedback      = null;

        // ── LISTENING: fuzzy text match ──
        if (question.section === 'LISTENING') {
          const similarity = fuzzyMatch(answer.typed_answer, question.text_en);
          marksAwarded  = listeningMarks(similarity, question.marks);
          isCorrect     = similarity >= 0.85;
          accuracyScore = Math.round(similarity * 100);
          feedback      = isCorrect
            ? 'চমৎকার! সঠিক উত্তর।'
            : `সঠিক বানান: "${question.text_en}"`;
          listeningObtained += marksAwarded;
        }

        // ── SPEAKING: Azure pronunciation assessment ──
        if (question.section === 'SPEAKING') {
          if (answer.audio_buffer) {
            try {
              const result = await aiService.assessPronunciation(answer.audio_buffer, question.text_en);
              const overallScore = result.overall_score || result.accuracy_score || 0;
              accuracyScore = overallScore;
              feedback      = result.feedback;
              isCorrect     = overallScore >= 60;
              marksAwarded  = speakingMarks(overallScore, question.marks);
              speakingObtained += marksAwarded;

              // Log phoneme scores for SRS progress tracking
              if (result.phonemes?.length > 0) {
                progressModel.logPhonemeScores(
                  exam.user_id,
                  question.word_id || null,
                  question.phrase_id || null,
                  result.phonemes
                ).catch(err => console.warn('logPhonemeScores error:', err.message));
              }
            } catch (err) {
              console.error(`Speaking assessment failed for answer ${answer.id}:`, err.message);
              feedback     = 'অডিও মূল্যায়নে সমস্যা হয়েছে।';
              marksAwarded = 0;
            }
          } else {
            // No audio submitted
            feedback     = 'কোনো অডিও রেকর্ড করা হয়নি।';
            marksAwarded = 0;
          }
        }

        totalMarksAwarded += marksAwarded;

        await examModel.updateAnswerScore(answer.id, {
          marks_awarded: marksAwarded,
          is_correct:    isCorrect,
          accuracy_score: accuracyScore,
          feedback,
        });

        evaluatedAnswersData.push({
          questionText: question.text_en,
          section:      question.section,
          typedAnswer:  answer.typed_answer,
          marksAwarded,
          maxMarks:     question.marks,
          accuracyScore,
        });
      }

      // 4. Calculate scores
      const scorePct        = exam.total_marks > 0 ? (totalMarksAwarded / exam.total_marks) * 100 : 0;
      const listeningScore  = listeningTotal > 0 ? (listeningObtained / listeningTotal) * 100 : null;
      const speakingScore   = speakingTotal  > 0 ? (speakingObtained  / speakingTotal)  * 100 : null;

      // 5. LLM summary feedback in Bangla
      const summaryText = await aiService.evaluateExamSummary(
        Math.round(scorePct),
        JSON.stringify(evaluatedAnswersData.slice(0, 10)) // cap payload
      );

      // 6. Persist final results
      await examModel.updateExamStatus(examId, 'EVALUATED', {
        obtained_marks:  totalMarksAwarded,
        score_pct:       scorePct,
        listening_score: listeningScore,
        speaking_score:  speakingScore,
        feedback_bn:     summaryText,
        evaluated_at:    new Date(),
      });

      // 7. Award XP (skip for PRACTICE)
      if (exam.awards_xp) {
        const xpAmount = calcXP(exam.exam_type, scorePct);
        if (xpAmount > 0) {
          await progressModel.addXP(exam.user_id, xpAmount, 'exam_evaluated');
        }
      }

      // 8. Update streak (always — even for PRACTICE)
      await progressModel.updateStreak(exam.user_id);

      // 9. Emit event → NotificationService picks this up and pushes via Socket.IO
      bus.emit(Events.EXAM_EVALUATED, {
        userId:        exam.user_id,
        examId:        exam.id,
        scorePct:      Math.round(scorePct),
        title:         exam.title,
        summaryText,
      });

      console.log(`[ExamEvaluator] Exam ${examId} evaluated. Score: ${Math.round(scorePct)}%`);

    } catch (err) {
      console.error(`[ExamEvaluator] Failed to evaluate exam ${examId}:`, err.message);
      try {
        await examModel.updateExamStatus(examId, 'FAILED');
      } catch (e) {
        console.error('[ExamEvaluator] Could not mark exam as FAILED:', e.message);
      }
    }
  }
}

module.exports = new ExamEvaluator();
