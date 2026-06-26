const ExamModel = require('../models/exam.model');
const ProgressModel = require('../models/progress.model');
const aiService = require('./aiService');
const bus = require('../events/eventBus');
const Events = require('../events/eventsNames');

// ─── Levenshtein distance (no external deps) ──────────────────────────────────
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            matrix[i][j] = b[i - 1] === a[j - 1]
                ? matrix[i - 1][j - 1]
                : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
    }
    return matrix[b.length][a.length];
}

function fuzzyMatch(userAnswer, correctAnswer) {
    const normalize = s => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const a = normalize(userAnswer);
    const b = normalize(correctAnswer);
    if (a === b) return 1.0;
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1.0;
    return 1 - (levenshteinDistance(a, b) / maxLen);
}

// ─── Marks calculators ────────────────────────────────────────────────────────
function listeningMarks(similarity, fullMarks) {
    if (similarity >= 0.85) return fullMarks;
    if (similarity >= 0.60) return fullMarks * 0.5;
    return 0;
}

function speakingMarks(azureScore, fullMarks) {
    if (azureScore >= 85) return fullMarks;
    if (azureScore >= 70) return fullMarks * 0.75;
    if (azureScore >= 50) return fullMarks * 0.50;
    return fullMarks * 0.25;
}

// ─── XP formula per exam type ────────────────────────────────────────────────
function calcXP(examType, scorePct) {
    switch (examType) {
        case 'LESSON':   return 20 + Math.round(scorePct * 0.3);
        case 'CHAPTER':  return 30 + Math.round(scorePct * 0.5);
        case 'PROGRESS': return 20 + Math.round(scorePct * 0.5);
        case 'IELTS':    return 40 + Math.round(scorePct * 0.6);
        default:         return 0; // PRACTICE — no XP
    }
}

// ─── Main background evaluator ───────────────────────────────────────────────
async function evaluateExam(examId) {
    const examModel    = new ExamModel();
    const progressModel = new ProgressModel();

    try {
        // Guard: don't re-evaluate
        const existing = await examModel.getExamById(examId);
        if (!existing) throw new Error(`Exam ${examId} not found`);
        if (['EVALUATING', 'EVALUATED'].includes(existing.exam.status)) {
            console.warn(`[Evaluator] Exam ${examId} is already ${existing.exam.status} — skipping.`);
            return;
        }

        await examModel.updateExamStatus(examId, 'EVALUATING');

        const data = await examModel.getExamWithAnswers(examId);
        if (!data) throw new Error(`Exam ${examId} not found`);

        let totalObtained = 0;
        let listeningTotal = 0;
        let listeningObtained = 0;
        let speakingTotal = 0;
        let speakingObtained = 0;

        for (const q of data.questions) {
            const answer = data.answers.find(a => a.question_id === q.id);

            if (q.section === 'LISTENING') {
                listeningTotal += q.marks;
                if (!answer) continue;

                const similarity = fuzzyMatch(answer.typed_answer, q.text_en);
                const awarded = listeningMarks(similarity, q.marks);

                await examModel.updateAnswerScore(answer.id, {
                    marks_awarded: awarded,
                    is_correct: similarity >= 0.85,
                    accuracy_score: Math.round(similarity * 100)
                });
                totalObtained += awarded;
                listeningObtained += awarded;
            }

            if (q.section === 'SPEAKING') {
                speakingTotal += q.marks;
                if (!answer || !answer.audio_buffer) continue;

                try {
                    const result = await aiService.assessPronunciation(
                        answer.audio_buffer, q.text_en
                    );
                    const awarded = speakingMarks(result.overall_score, q.marks);

                    await examModel.updateAnswerScore(answer.id, {
                        marks_awarded: awarded,
                        is_correct: result.overall_score >= 60,
                        accuracy_score: result.overall_score,
                        feedback: result.feedback
                    });
                    totalObtained += awarded;
                    speakingObtained += awarded;

                    // Log phoneme data back to progress system
                    if (result.phonemes?.length) {
                        await progressModel.logPhonemeScores(
                            data.exam.user_id, q.word_id, q.phrase_id, result.phonemes
                        ).catch(e => console.error('[Evaluator] logPhonemeScores failed:', e.message));
                    }
                } catch (azureErr) {
                    console.error(`[Evaluator] Azure assessment failed for question ${q.id}:`, azureErr.message);
                    // Award 25 % (minimal credit) so a failed assessment doesn't zero the question
                    const awarded = q.marks * 0.25;
                    if (answer?.id) {
                        await examModel.updateAnswerScore(answer.id, {
                            marks_awarded: awarded,
                            is_correct: false,
                            accuracy_score: 0,
                            feedback: 'মূল্যায়ন ব্যর্থ হয়েছে।'
                        });
                    }
                    totalObtained += awarded;
                    speakingObtained += awarded;
                }
            }
        }

        const totalMarks = data.exam.total_marks || (listeningTotal + speakingTotal) || 30;
        const scorePct   = Math.min((totalObtained / totalMarks) * 100, 100);

        // LLM summary feedback
        let feedbackBn = null;
        try {
            feedbackBn = await aiService.evaluateExamSummary(data, scorePct);
        } catch (e) {
            console.warn('[Evaluator] evaluateExamSummary failed:', e.message);
            feedbackBn = scorePct >= 70
                ? 'চমৎকার! আপনি ভালো পরীক্ষা দিয়েছেন।'
                : 'আরেকটু অনুশীলন করলে আরও ভালো করবেন।';
        }

        await examModel.updateExamStatus(examId, 'EVALUATED', {
            obtained_marks: Math.round(totalObtained * 100) / 100,
            score_pct:      Math.round(scorePct * 100) / 100,
            feedback_bn:    feedbackBn
        });

        console.log(`[Evaluator] Exam ${examId} evaluated — score: ${scorePct.toFixed(1)}%`);

        // ── XP & Streak ──────────────────────────────────────────────────────
        if (data.exam.awards_xp) {
            const xpAmount = calcXP(data.exam.exam_type, scorePct);
            if (xpAmount > 0) {
                await progressModel.addXP(data.exam.user_id, xpAmount, 'exam_evaluated')
                    .catch(e => console.error('[Evaluator] addXP failed:', e.message));
            }
        }

        // Always update streak (even for PRACTICE)
        await progressModel.updateStreak(data.exam.user_id)
            .catch(e => console.error('[Evaluator] updateStreak failed:', e.message));

        // ── Emit event → NotificationService picks it up ─────────────────────
        bus.emit(Events.EXAM_EVALUATED, {
            userId:   data.exam.user_id,
            examId:   examId,
            scorePct: scorePct,
            title:    data.exam.title
        });

    } catch (err) {
        console.error(`[Evaluator] Fatal error evaluating exam ${examId}:`, err.message);
        try {
            const examModel2 = new ExamModel();
            await examModel2.updateExamStatus(examId, 'FAILED');
        } catch (_) {}
    }
}

module.exports = { evaluateExam };
