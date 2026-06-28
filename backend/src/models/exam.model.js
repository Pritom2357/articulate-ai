const DB_Connection = require('../database/db');

class ExamModel {
    constructor() {
        this.db = DB_Connection.getInstance();
    }

    checkLessonCompleted = async (userId, lessonId) => {
        const check = await this.db.query_executor(
            `SELECT status FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2`,
            [userId, lessonId]
        );
        return check.rows[0]?.status === 'COMPLETED';
    }

    checkChapterCompleted = async (userId, chapterId) => {
        const check = await this.db.query_executor(
            `SELECT status FROM vw_user_chapter_progress WHERE user_id = $1 AND chapter_id = $2`,
            [userId, chapterId]
        );
        return check.rows[0]?.status === 'COMPLETED';
    }

    markExamReady = async (examId, totalMarks) => {
        await this.db.query_executor(
            `UPDATE exams SET status = 'READY', total_marks = $1 WHERE id = $2`,
            [totalMarks, examId]
        );
    }

    getAnswerAudioBuffer = async (answerId, userId) => {
        const answer = await this.db.query_executor(
            `SELECT audio_buffer FROM exam_answers 
             WHERE id = $1 AND exam_id IN (SELECT id FROM exams WHERE user_id = $2)`,
            [answerId, userId]
        );
        return answer.rows[0]?.audio_buffer || null;
    }

    createExam = async (userId, examType, contextData) => {
        try {
            const query = `
                INSERT INTO exams (user_id, exam_type, lesson_id, chapter_id, title, title_bn, total_marks, time_limit_seconds, difficulty_level, awards_xp)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *;
            `;
            const params = [
                userId,
                examType,
                contextData.lesson_id   || null,
                contextData.chapter_id  || null,
                contextData.title       || 'Exam',
                contextData.title_bn    || null,
                contextData.total_marks || 0,
                contextData.time_limit_seconds || 1200,
                contextData.difficulty_level   || 3,
                examType !== 'PRACTICE'   // PRACTICE awards no XP
            ];
            const result = await this.db.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Failed to create exam: ${error.message}`);
        }
    }

    insertQuestions = async (examId, questionsArray) => {
        try {
            for (let i = 0; i < questionsArray.length; i++) {
                const q = questionsArray[i];
                const query = `
                    INSERT INTO exam_questions
                        (exam_id, section, item_type, order_num, text_en, text_bn, audio_url, ipa, marks, difficulty, word_id, phrase_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `;
                const params = [
                    examId,
                    q.section,
                    q.item_type,
                    i + 1,
                    q.text_en,
                    q.text_bn    || null,
                    q.audio_url  || null,
                    q.ipa        || null,
                    q.marks      || 1,
                    q.difficulty || 3,
                    q.word_id    || null,
                    q.phrase_id  || null,
                ];
                await this.db.query_executor(query, params);
            }
            return true;
        } catch (error) {
            throw new Error(`Failed to insert questions: ${error.message}`);
        }
    }

    getExamById = async (examId) => {
        try {
            const [examRes, questionsRes] = await Promise.all([
                this.db.query_executor(`SELECT * FROM exams WHERE id = $1;`, [examId]),
                this.db.query_executor(
                    `SELECT id, exam_id, section, item_type, order_num, text_en, text_bn,
                            audio_url, ipa, marks, difficulty, word_id, phrase_id
                     FROM exam_questions WHERE exam_id = $1 ORDER BY order_num ASC;`,
                    [examId]
                ),
            ]);
            return {
                exam:      examRes.rows[0] || null,
                questions: questionsRes.rows || [],
            };
        } catch (error) {
            throw new Error(`Failed to get exam: ${error.message}`);
        }
    }

    getExamsByUser = async (userId, limit = 20) => {
        try {
            const query = `
                SELECT id, title, title_bn, exam_type, status,
                       total_marks, obtained_marks, score_pct,
                       listening_score, speaking_score,
                       time_limit_seconds, created_at, started_at, submitted_at, evaluated_at
                FROM exams
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT $2;
            `;
            const result = await this.db.query_executor(query, [userId, limit]);
            return result.rows || [];
        } catch (error) {
            throw new Error(`Failed to get user exams: ${error.message}`);
        }
    }

    submitAnswers = async (examId, answersArray) => {
        try {
            for (const ans of answersArray) {
                if (!ans.question_id) continue;
                const query = `
                    INSERT INTO exam_answers (exam_id, question_id, typed_answer, audio_buffer)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (exam_id, question_id) DO UPDATE SET
                        typed_answer = EXCLUDED.typed_answer,
                        audio_buffer = EXCLUDED.audio_buffer,
                        submitted_at = NOW();
                `;
                await this.db.query_executor(query, [
                    examId,
                    ans.question_id,
                    ans.typed_answer  || null,
                    ans.audio_buffer  || null,
                ]);
            }
            return true;
        } catch (error) {
            throw new Error(`Failed to submit answers: ${error.message}`);
        }
    }

    updateExamStatus = async (examId, status, scoreData = {}) => {
        try {
            const query = `
                UPDATE exams
                SET status          = $1,
                    obtained_marks  = COALESCE($2::numeric, obtained_marks),
                    score_pct       = COALESCE($3::numeric, score_pct),
                    listening_score = COALESCE($4::numeric, listening_score),
                    speaking_score  = COALESCE($5::numeric, speaking_score),
                    feedback_bn     = COALESCE($6::text, feedback_bn),
                    evaluated_at    = COALESCE($7::timestamp, evaluated_at),
                    started_at      = CASE WHEN $9 = 'IN_PROGRESS' AND started_at IS NULL THEN NOW() ELSE started_at END,
                    submitted_at    = CASE WHEN $9 = 'SUBMITTED'   AND submitted_at IS NULL THEN NOW() ELSE submitted_at END
                WHERE id = $8
                RETURNING *;
            `;
            const params = [
                status,
                scoreData.obtained_marks  !== undefined ? scoreData.obtained_marks  : null,
                scoreData.score_pct       !== undefined ? scoreData.score_pct       : null,
                scoreData.listening_score !== undefined ? scoreData.listening_score : null,
                scoreData.speaking_score  !== undefined ? scoreData.speaking_score  : null,
                scoreData.feedback_bn     || null,
                scoreData.evaluated_at    || null,
                examId,
                status // $9 for text comparison
            ];
            const result = await this.db.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Failed to update exam status: ${error.message}`);
        }
    }

    getExamWithAnswers = async (examId) => {
        try {
            const examData   = await this.getExamById(examId);
            const answersRes = await this.db.query_executor(
                `SELECT * FROM exam_answers WHERE exam_id = $1;`,
                [examId]
            );
            return {
                ...examData,
                answers: answersRes.rows || [],
            };
        } catch (error) {
            throw new Error(`Failed to get exam with answers: ${error.message}`);
        }
    }

    // Alias used by results endpoint — returns full data including answers
    getExamResults = async (examId) => {
        try {
            const [examRes, questionsRes, answersRes] = await Promise.all([
                this.db.query_executor(`SELECT * FROM exams WHERE id = $1;`, [examId]),
                this.db.query_executor(
                    `SELECT id, exam_id, section, item_type, order_num, text_en, text_bn,
                            audio_url, ipa, marks, difficulty, word_id, phrase_id
                     FROM exam_questions WHERE exam_id = $1 ORDER BY order_num ASC;`,
                    [examId]
                ),
                this.db.query_executor(
                    `SELECT id, exam_id, question_id, typed_answer,
                            is_correct, marks_awarded, accuracy_score, feedback, submitted_at
                     FROM exam_answers WHERE exam_id = $1;`,
                    [examId]
                ),
            ]);
            return {
                exam:      examRes.rows[0]    || null,
                questions: questionsRes.rows  || [],
                answers:   answersRes.rows    || [],
            };
        } catch (error) {
            throw new Error(`Failed to get exam results: ${error.message}`);
        }
    }

    updateAnswerScore = async (answerId, data) => {
        try {
            const query = `
                UPDATE exam_answers
                SET marks_awarded  = $1,
                    is_correct     = $2,
                    accuracy_score = $3,
                    feedback       = $4
                WHERE id = $5;
            `;
            await this.db.query_executor(query, [
                data.marks_awarded,
                data.is_correct,
                data.accuracy_score !== undefined ? data.accuracy_score : null,
                data.feedback       || null,
                answerId,
            ]);
        } catch (error) {
            throw new Error(`Failed to update answer score: ${error.message}`);
        }
    }
}

module.exports = new ExamModel();
