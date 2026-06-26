const DB_Connection = require('../database/db');

class ExamModel {
    constructor() {
        this.db = DB_Connection.getInstance();
    }

    async createExam(userId, examType, contextData) {
        const title = contextData.title || `${examType} Exam`;
        const awardsXp = examType !== 'PRACTICE';

        const query = `
            INSERT INTO exams (
                user_id, exam_type, lesson_id, chapter_id,
                title, total_marks, awards_xp, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'GENERATING')
            RETURNING *;
        `;
        const values = [
            userId, examType,
            contextData.lessonId || null, contextData.chapterId || null,
            title, contextData.totalMarks || 30, awardsXp
        ];

        const res = await this.db.query_executor(query, values);
        return res.rows[0];
    }

    async insertQuestions(examId, questionsArray) {
        if (!questionsArray || questionsArray.length === 0) return;

        const insertQuery = `
            INSERT INTO exam_questions (
                exam_id, section, item_type, order_num,
                text_en, text_bn, audio_url, ipa, marks, difficulty, word_id, phrase_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;

        for (let i = 0; i < questionsArray.length; i++) {
            const q = questionsArray[i];
            await this.db.query_executor(insertQuery, [
                examId,
                q.section,
                q.item_type,
                i + 1,
                q.text_en,
                q.text_bn || null,
                q.audio_url || null,
                q.ipa || null,
                q.marks || 1,
                q.difficulty || 3,
                q.word_id || null,
                q.phrase_id || null
            ]);
        }

        // update total marks
        const marksSum = questionsArray.reduce((sum, q) => sum + (q.marks || 1), 0);
        await this.db.query_executor(
            `UPDATE exams SET total_marks = $1, status = 'READY' WHERE id = $2`,
            [marksSum, examId]
        );
    }

    async getExamById(examId) {
        const examRes = await this.db.query_executor(
            `SELECT * FROM exams WHERE id = $1`,
            [examId]
        );
        if (examRes.rows.length === 0) return null;

        const questionsRes = await this.db.query_executor(
            `SELECT * FROM exam_questions WHERE exam_id = $1 ORDER BY order_num ASC`,
            [examId]
        );

        return {
            exam: examRes.rows[0],
            questions: questionsRes.rows
        };
    }

    async getExamsByUser(userId, filters = {}) {
        let query = `SELECT * FROM exams WHERE user_id = $1`;
        const values = [userId];
        let idx = 2;

        if (filters.status) {
            query += ` AND status = $${idx++}`;
            values.push(filters.status);
        }

        query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        values.push(filters.limit || 10, filters.offset || 0);

        const res = await this.db.query_executor(query, values);
        return res.rows;
    }

    async submitAnswers(examId, answersArray) {
        if (!answersArray || answersArray.length === 0) return;

        const insertQuery = `
            INSERT INTO exam_answers (exam_id, question_id, typed_answer, audio_url, audio_buffer)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (exam_id, question_id) DO UPDATE
            SET typed_answer = EXCLUDED.typed_answer,
                audio_url = EXCLUDED.audio_url,
                audio_buffer = EXCLUDED.audio_buffer,
                submitted_at = NOW()
        `;

        for (const a of answersArray) {
            await this.db.query_executor(insertQuery, [
                examId,
                a.question_id,
                a.typed_answer || null,
                a.audio_url || null,
                a.audio_buffer || null
            ]);
        }

        await this.updateExamStatus(examId, 'SUBMITTED');
    }

    async updateExamStatus(examId, status, scoreData = {}) {
        let query = `UPDATE exams SET status = $2`;
        const values = [examId, status];
        let idx = 3;

        if (status === 'SUBMITTED') query += `, submitted_at = NOW()`;
        if (status === 'EVALUATED') query += `, evaluated_at = NOW()`;
        if (status === 'IN_PROGRESS') query += `, started_at = NOW()`;

        if (scoreData.obtained_marks !== undefined) {
            query += `, obtained_marks = $${idx++}`;
            values.push(scoreData.obtained_marks);
        }
        if (scoreData.score_pct !== undefined) {
            query += `, score_pct = $${idx++}`;
            values.push(scoreData.score_pct);
        }
        if (scoreData.feedback_bn !== undefined) {
            query += `, feedback_bn = $${idx++}`;
            values.push(scoreData.feedback_bn);
        }

        query += ` WHERE id = $1`;
        await this.db.query_executor(query, values);
    }

    async getExamResults(examId) {
        return this.getExamWithAnswers(examId);
    }

    async getExamWithAnswers(examId) {
        const examRes = await this.db.query_executor(
            `SELECT * FROM exams WHERE id = $1`,
            [examId]
        );
        if (examRes.rows.length === 0) return null;

        const questionsRes = await this.db.query_executor(
            `SELECT * FROM exam_questions WHERE exam_id = $1 ORDER BY order_num ASC`,
            [examId]
        );

        const answersRes = await this.db.query_executor(
            `SELECT * FROM exam_answers WHERE exam_id = $1`,
            [examId]
        );

        return {
            exam: examRes.rows[0],
            questions: questionsRes.rows,
            answers: answersRes.rows
        };
    }

    async updateAnswerScore(answerId, data) {
        await this.db.query_executor(
            `UPDATE exam_answers
             SET marks_awarded = $2, is_correct = $3, accuracy_score = $4, feedback = $5
             WHERE id = $1`,
            [
                answerId,
                data.marks_awarded || 0,
                data.is_correct || false,
                data.accuracy_score || 0,
                data.feedback || null
            ]
        );
    }
}

module.exports = ExamModel;
