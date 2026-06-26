const DB_Connection = require('../database/db')
const { sm2 } = require('../services/srs')
const bus = require('../events/eventBus.js')
const Events = require('../events/eventsNames.js')


// XP constants
const XP_LESSON_COMPLETE = 50
const XP_WORD_PASS_CLEAN = 20
const XP_WORD_PASS_FLAG = 10
const XP_CHAPTER_COMPLETE = 200
const XP_STREAK_BONUS = 30
const XP_PHONEME_MASTERED = 20

class ProgressModel {
    constructor() {
        this.db_connection = DB_Connection.getInstance();
        this._badgeCheckInProgress = new Set(); // re-entrancy guard for addXP <-> checkAndAwardBadges
    }

    ///////////// due cards ////////
    getDueCards = async (userId) => {
        try {
            const query = `
                select * from vw_due_cards
                WHERE user_id = $1
                ORDER BY next_review ASC
                LIMIT 20;
            `

            const params = [userId]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows || null
        }
        catch (error) {
            throw new Error(`Failed to fetch due cards: ${error.message}`)
        }
    }


    getCardById = async (userId, wordId) => {
        try {
            const query = `
                SELECT
                    streak,
                    easiness,
                    interval_days,
                    next_review
                FROM user_word_progress
                WHERE user_id = $1 AND word_id = $2;
            `

            const params = [userId, wordId]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows[0] || null
        }
        catch (error) {
            throw new Error(`Failed to fetch card: ${error.message}`)
        }
    }


    updateSrsCard = async (userId, wordId, pronunciationScore) => {
        try {
            let current = await this.getCardById(userId, wordId)
            if (!current) {
                // First time this user has attempted this word — provision a default SRS card
                // (table defaults: familiarity NEW, streak 0, easiness 2.5, interval_days 1, next_review today).
                await this.db_connection.query_executor(
                    `INSERT INTO user_word_progress (user_id, word_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
                    [userId, wordId]
                )
                current = await this.getCardById(userId, wordId)
                if (!current) {
                    throw new Error(`Card not found for user ${userId} and word ${wordId}`)
                }
            }

            const updated = sm2(current, pronunciationScore)

            let familiarity;
            if (updated.streak >= 6) familiarity = 'MASTERED'
            else if (updated.streak >= 3) familiarity = 'FAMILIAR'
            else familiarity = 'LEARNING';

            // considering correct for score >= 60
            const isCorrect = pronunciationScore >= 60

            const query = `
                UPDATE user_word_progress
                SET
                    streak = $1,
                    easiness = $2,
                    interval_days = $3,
                    next_review = $4,
                    familiarity = $5,
                    correct_count = correct_count + $6,
                    wrong_count = wrong_count + $7,
                    last_reviewed = NOW()
                WHERE user_id = $8 AND word_id = $9
                RETURNING *;
            `

            const params = [
                updated.streak,
                updated.easiness,
                updated.interval_days,
                updated.next_review,
                familiarity,
                isCorrect ? 1 : 0,
                isCorrect ? 0 : 1,
                userId,
                wordId
            ]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows[0] || null
        }
        catch (error) {
            throw new Error(`Failed to update SRS card: ${error.message}`)
        }
    }


    // rewards
    addXP = async (userId, amount, reason) => {
        try {
            const query = `
                UPDATE user_progress
                SET xp = xp + $1
                WHERE user_id = $2
                RETURNING xp;
            `

            const params = [amount, userId]
            const result = await this.db_connection.query_executor(query, params)

            if (!result.rows[0]) {
                throw new Error(`No user_progress row for user=${userId}`)
            }

            // log XP gain
            const logQuery = `
                INSERT INTO user_xp_log (user_id, amount, reason)
                VALUES ($1, $2, $3);
            `

            const logParams = [userId, amount, reason]
            await this.db_connection.query_executor(logQuery, logParams)

            // check for level-up
            const newXP = result.rows[0].xp

            let newLevel;
            if (newXP >= 7000) newLevel = 5
            else if (newXP >= 3500) newLevel = 4
            else if (newXP >= 1500) newLevel = 3
            else if (newXP >= 500) newLevel = 2
            else newLevel = 1

            const levelQuery = `
                UPDATE user_progress
                SET level = $1
                WHERE user_id = $2
                RETURNING xp, level;
            `
            const levelParams = [newLevel, userId]
            const levelResult = await this.db_connection.query_executor(levelQuery, levelParams)

            // check and award badges
            await this.checkAndAwardBadges(userId)

            return levelResult.rows[0] || null
        }
        catch (error) {
            throw new Error(`Failed to add XP: ${error.message}`)
        }
    }


    getUserBadges = async (userId) => {
        try {
            const query = `
            SELECT
                ub.user_id,
                b.badge_id,
                b.title,
                b.description,
                b.xp_reward,
                b.icon_url,
                ub.earned_at,
                CASE WHEN ub.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS earned
            FROM badges b
            LEFT JOIN user_badges ub ON b.badge_id = ub.badge_id AND ub.user_id = $1
            ORDER BY earned DESC, ub.earned_at DESC, badge_id ASC;
        `
            const result = await this.db_connection.query_executor(query, [userId])

            return result.rows || []
        } catch (error) {
            throw new Error(`Failed to fetch user badges: ${error.message}`)
        }
    }


    checkAndAwardBadges = async (userId) => {
        if (this._badgeCheckInProgress.has(userId)) return null // re-entrancy guard
        this._badgeCheckInProgress.add(userId)

        try {
            const statsQuery = `
                SELECT * FROM vw_user_stats
                WHERE user_id = $1;
            `
            const statsResult = await this.db_connection.query_executor(statsQuery, [userId])

            const stats = statsResult.rows[0]
            if (!stats) return null

            // Count FAMILIAR and MASTERED words
            const wordQuery = `
                SELECT COUNT(*) AS good_words
                FROM user_word_progress
                WHERE user_id = $1
                  AND familiarity IN ('FAMILIAR', 'MASTERED');
            `
            const wordCountResult = await this.db_connection.query_executor(wordQuery, [userId])

            const goodWords = parseInt(wordCountResult.rows[0]?.good_words || 0)

            // Check completed chapters using the existing view
            const chapterQuery = `
                SELECT chapter_id
                FROM vw_user_chapter_progress
                WHERE user_id = $1
                AND status = 'COMPLETED';
            `
            const chapterResult = await this.db_connection.query_executor(chapterQuery, [userId])

            const completedChapters = new Set(chapterResult.rows.map(r => parseInt(r.chapter_id)))

            // conditions: [badge_id, condition_met]
            const conditions = [
                // Streaks
                ['streak_3', stats.streak_days >= 3],
                ['streak_7', stats.streak_days >= 7],
                ['streak_15', stats.streak_days >= 15],
                ['streak_30', stats.streak_days >= 30],
                ['streak_60', stats.streak_days >= 60],
                ['streak_100', stats.streak_days >= 100],
                // Words mastered
                ['words_10', goodWords >= 10],
                ['words_50', goodWords >= 50],
                ['words_100', goodWords >= 100],
                ['words_250', goodWords >= 250],
                ['words_500', goodWords >= 500],
                ['words_750', goodWords >= 750],
                ['words_1000', goodWords >= 1000],
                // Chapters (dynamic — checks all 8)
                ['chapter_1', completedChapters.has(9)],
                ['chapter_2', completedChapters.has(10)],
                ['chapter_3', completedChapters.has(11)],
                ['chapter_4', completedChapters.has(12)],
                ['chapter_5', completedChapters.has(13)],
                ['chapter_6', completedChapters.has(14)],
                ['chapter_7', completedChapters.has(15)],
                ['chapter_8', completedChapters.has(16)]
                // General milestones
                ['first_lesson', parseInt(stats.completed_lessons) >= 1],
                ['first_test', parseInt(stats.completed_tests) >= 1],
                ['perfect_test', parseInt(stats.perfect_tests) >= 1]
            ]

            // Fetch badges the user already has
            const badges = await this.getUserBadges(userId)
            const owned = badges.filter(badge => badge.earned)
            const ownedIds = new Set(owned.map(b => b.badge_id))

            // Award new badges
            for (const [badgeId, conditionMet] of conditions) {
                if (!conditionMet || ownedIds.has(badgeId)) continue

                const insertQuery = `
                    INSERT INTO user_badges (user_id, badge_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING;
                `
                const insertParams = [userId, badgeId]
                await this.db_connection.query_executor(insertQuery, insertParams)

                // Fetch badge details for XP reward & socket push
                const badgeQuery = `
                    SELECT badge_id, title, description, xp_reward, icon_url
                    FROM badges WHERE badge_id = $1;`
                const badgeResult = await this.db_connection.query_executor(badgeQuery, [badgeId])

                const badge = badgeResult.rows[0]
                if (!badge) continue

                // Award XP from badge
                await this.addXP(userId, badge.xp_reward, 'badge_unlock')


                // Shout the event to the Event Bus ->  to show a real-time notification to  user
                bus.emit(Events.BADGE_UNLOCKED, {
                    userId,
                    badge_id: badge.badge_id,
                    title: badge.title,
                    description: badge.description,
                    xp_reward: badge.xp_reward,
                    icon_url: badge.icon_url,
                    earned_at: new Date()
                })

            }

        }
        catch (error) {
            throw new Error(`Failed to check/award badges: ${error.message}`)
        }
        finally {
            this._badgeCheckInProgress.delete(userId)  // reset the guard
        }
    }


    updateStreak = async (userId) => {
        try {
            const fetchQuery = `
                SELECT streak_days, last_active
                FROM user_progress
                WHERE user_id = $1;
            `
            const result = await this.db_connection.query_executor(fetchQuery, [userId])

            if (!result.rows[0]) {
                const insertQuery = `
                    INSERT INTO user_progress (user_id, streak_days, last_active)
                    VALUES ($1, 1, CURRENT_DATE)
                    RETURNING streak_days;
                `
                const insertResult = await this.db_connection.query_executor(insertQuery, [userId])

                return insertResult.rows[0]
            }

            const { streak_days, last_active } = result.rows[0]
            let newStreak

            const today = new Date()
            today.setHours(0, 0, 0, 0) // normalize to midnight

            if (!last_active) newStreak = 1 // first-ever activity
            else {
                const lastDate = new Date(last_active)
                lastDate.setHours(0, 0, 0, 0)

                const diffDays = Math.floor(
                    (today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)
                )

                if (diffDays === 0) return result.rows[0] // already active today -> no change
                else if (diffDays === 1) newStreak = streak_days + 1
                else newStreak = 1 // missed a day or more -> streak resets
            }

            // Save the updated streak and set last_active to today
            const updateQuery = `
                UPDATE user_progress
                SET streak_days = $1,
                    last_active = CURRENT_DATE
                WHERE user_id = $2
                RETURNING streak_days;
            `

            const params = [newStreak, userId]
            const updateResult = await this.db_connection.query_executor(updateQuery, params)

            return updateResult.rows[0]
        }

        catch (error) {
            throw new Error(`Failed to update streak: ${error.message}`);
        }
    }


    // mark complete
    markLessonComplete = async (userId, lessonId, score) => {
        try {
            const query = `
                INSERT INTO user_lesson_progress
                    (user_id, lesson_id, score, status, completed_at, started_at, attempts, completion_pct)
                VALUES(
                    $1,
                    $2,
                    $3,
                    'COMPLETED',
                    NOW(),
                    NOW(),
                    1,
                    100
                )
                ON CONFLICT (user_id, lesson_id) DO UPDATE
                SET
                    status = 'COMPLETED',
                    score = GREATEST(user_lesson_progress.score, $3),
                    completed_at = NOW(),
                    attempts = user_lesson_progress.attempts + 1,
                    completion_pct = 100,
                    last_attempted_at = NOW()
                RETURNING *;
            `

            const params = [userId, lessonId, score]
            const result = await this.db_connection.query_executor(query, params)
            const lesson = result.rows[0] || null

            // update streak after completing a lesson
            await this.updateStreak(userId)

            // award xp
            const stats = await this.addXP(userId, XP_LESSON_COMPLETE, 'lesson_complete')

            // check if entire chapter is now finished
            const query2 = `
                SELECT status FROM vw_user_chapter_progress
                WHERE user_id = $1
                  AND chapter_id = (SELECT chapter_id FROM lessons WHERE id = $2)
            `

            const params2 = [userId, lessonId]
            const check = await this.db_connection.query_executor(query2, params2)

            if (check.rows[0]?.status === 'COMPLETED') {
                await this.addXP(userId, XP_CHAPTER_COMPLETE, 'chapter_complete')
            }

            return { lesson, stats }
        }
        catch (error) {
            throw new Error(`Failed to mark lesson complete: ${error.message}`)
        }
    }


    // user progress card
    getUserProgress = async (userId) => {
        try {
            const progressQuery = `
                SELECT * FROM vw_user_stats
                WHERE user_id = $1;
            `
            const chaptersQuery = `
                SELECT * FROM vw_user_chapter_progress
                WHERE user_id = $1
                ORDER BY chapter_order ASC;
            `
            const lessonsQuery = `
                SELECT * FROM user_lesson_progress
                WHERE user_id = $1;
            `
            const onboardingQuery = `
                SELECT assessed_level, vocab_score, pronunciation_score, assessed_at, ai_notes
                FROM onboarding_assessments
                WHERE user_id = $1
                ORDER BY assessed_at DESC
                LIMIT 1;
            `

            const placementQuery = `
                SELECT placement_chapter FROM user_progress WHERE user_id = $1
            `

            // run all queries parallely
            const [progressResult, badges, lessonsResult, chaptersResult, onboardingResult, placementResult] = await Promise.all([
                this.db_connection.query_executor(progressQuery, [userId]),
                this.getUserBadges(userId),
                this.db_connection.query_executor(lessonsQuery, [userId]),
                this.db_connection.query_executor(chaptersQuery, [userId]),
                this.db_connection.query_executor(onboardingQuery, [userId]),
                this.db_connection.query_executor(placementQuery, [userId])
            ])

            const progress = progressResult.rows[0] || {
                xp: 0, level: 1, streak_days: 0, last_active: null
            }

            // convert rows into map
            const lessonMap = {}
            for (const row of lessonsResult.rows) {
                lessonMap[row.lesson_id] = {
                    status: row.status,
                    completion_pct: row.completion_pct,
                    score: row.score,
                    attempts: row.attempts,
                    started_at: row.started_at,
                    completed_at: row.completed_at,
                    last_attempted_at: row.last_attempted_at
                }
            }

            // convert chapter rows into map
            const chapterMap = {}
            for (const row of chaptersResult.rows) {
                chapterMap[row.chapter_id] = {
                    chapter_title: row.chapter_title,
                    chapter_order: row.chapter_order,
                    total_lessons: row.total_lessons,
                    attempted_lessons: row.attempted_lessons,
                    completed_lessons: row.completed_lessons,
                    status: row.status,
                    completion_pct: row.completion_pct,
                    total_score: row.total_score
                }
            }

            return {
                xp: progress.xp,
                level: progress.level,
                streak_days: progress.streak_days,
                placement_chapter: placementResult.rows[0]?.placement_chapter ?? 1,
                badges: badges || [],
                lessons: lessonMap,
                chapters: chapterMap,
                onboarding: onboardingResult.rows[0] || null
            }
        }

        catch (error) {
            throw new Error(`Failed to get user progress: ${error.message}`)
        }
    }


    getStreakCalendar = async (userId, year, month) => {
        try {
            const query = `
                SELECT DISTINCT active_date FROM vw_user_activity_dates
                WHERE
                    user_id = $1
                    AND EXTRACT(YEAR  FROM active_date) = $2
                    AND EXTRACT(MONTH FROM active_date) = $3
                ORDER BY active_date ASC;
            `

            const params = [userId, year, month]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows || []
        }
        catch (error) {
            throw new Error(`Failed to fetch streak calendar: ${error.message}`)
        }
    }

    getXPLog = async (userId, limit = 25) => {
        try {
            const query = `
                SELECT log_id, amount, reason, created_at
                FROM user_xp_log
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT $2;
            `

            const params = [userId, limit]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows || null
        }
        catch (error) {
            throw new Error(`Failed to fetch XP log: ${error.message}`)
        }
    }


    getLeaderboard = async (limit = 200) => {
        try {
            const query = `
            SELECT
                u.id,
                u.name,
                u.profile_photo,
                up.xp,
                up.level,
                up.streak_days,
                RANK() OVER (ORDER BY up.xp DESC) AS rank
            FROM user_progress up
            JOIN users u ON u.id = up.user_id
            WHERE u.is_active = TRUE
            ORDER BY up.xp DESC
            LIMIT $1;
        `

            const result = await this.db_connection.query_executor(query, [limit])

            return result.rows || null
        } catch (error) {
            throw new Error(`Failed to fetch leaderboard: ${error.message}`)
        }
    }


    // later additions
    getChapterConversationPoints = async (chapterId) => {
        try {
            const query = `
                SELECT conversation_key_points
                FROM chapters
                WHERE id = $1;
            `;
            const result = await this.db_connection.query_executor(query, [chapterId]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Failed to get chapter conversation points: ${error.message}`);
        }
    }

    saveConversationScore = async (userId, chapterId, score) => {
        try {
            // Find a lesson of type 'TEST' or similar for this chapter to mark complete
            const lessonQuery = `
                SELECT id FROM lessons
                WHERE chapter_id = $1 AND type = 'TEST'
                LIMIT 1;
            `;
            const lessonResult = await this.db_connection.query_executor(lessonQuery, [chapterId]);
            const lessonId = lessonResult.rows[0]?.id;

            if (lessonId) {
                // Mark completion of the test lesson
                await this.markLessonComplete(userId, lessonId, score);
            }
            return true;
        } catch (error) {
            throw new Error(`Failed to save conversation score: ${error.message}`);
        }
    }


    getUserProfile = async (userId) => {
        try {
            const query = `
                SELECT u.id, u.name, u.email, u.guide_preference, oa.assessed_level
                FROM users u
                LEFT JOIN onboarding_assessments oa ON oa.user_id = u.id
                WHERE u.id = $1
                ORDER BY oa.assessed_at DESC
                LIMIT 1;
            `;
            const result = await this.db_connection.query_executor(query, [userId]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Failed to get user profile: ${error.message}`);
        }
    }

    getUserWeakWords = async (userId) => {
        try {
            const query = `
                SELECT w.word, w.bangla_meaning, uwp.wrong_count
                FROM user_word_progress uwp
                JOIN words w ON w.id = uwp.word_id
                WHERE uwp.user_id = $1 AND uwp.wrong_count > 0
                ORDER BY uwp.wrong_count DESC
                LIMIT 10;
            `;
            const result = await this.db_connection.query_executor(query, [userId]);
            return result.rows || [];
        } catch (error) {
            throw new Error(`Failed to get user weak words: ${error.message}`);
        }
    }


    /**
     * Record per-phoneme scores from a pronunciation attempt, update the rolling
     * per-(user, phoneme) summary, award XP on fresh mastery, and flag phonemes
     * whose fail streak just hit 3 (caller emits the RAG_TRIGGER event for these).
     * @param {number} userId
     * @param {number|null} wordId
     * @param {Array<{phoneme: string, score: number}>} phonemes
     * @returns {Promise<{masteredPhonemes: string[], ragTriggerPhonemes: string[]}>}
     */
    logPhonemeScores = async (userId, wordId, phraseId, phonemes) => {
        const masteredPhonemes = [];
        const ragTriggerPhonemes = [];

        try {
            for (const { phoneme, score } of phonemes) {
                await this.db_connection.query_executor(
                    `INSERT INTO user_phoneme_scores (user_id, phoneme, score, word_id, phrase_id) VALUES ($1, $2, $3, $4, $5);`,
                    [userId, phoneme, score, wordId, phraseId]
                );

                const upsertQuery = `
                    INSERT INTO user_phoneme_summary (user_id, phoneme, avg_score, total_attempts, fail_streak, mastered)
                    VALUES ($1, $2, $3, 1, $4, false)
                    ON CONFLICT (user_id, phoneme) DO UPDATE SET
                        avg_score = (user_phoneme_summary.avg_score * user_phoneme_summary.total_attempts + $3) / (user_phoneme_summary.total_attempts + 1),
                        total_attempts = user_phoneme_summary.total_attempts + 1,
                        fail_streak = CASE WHEN $3 >= 60 THEN 0 ELSE user_phoneme_summary.fail_streak + 1 END
                    RETURNING *;
                `;
                const failStreakOnInsert = score >= 60 ? 0 : 1;
                const { rows: [summary] } = await this.db_connection.query_executor(
                    upsertQuery,
                    [userId, phoneme, score, failStreakOnInsert]
                );

                if (!summary.mastered && summary.avg_score >= 90 && summary.total_attempts >= 10) {
                    await this.db_connection.query_executor(
                        `UPDATE user_phoneme_summary SET mastered = true WHERE user_id = $1 AND phoneme = $2;`,
                        [userId, phoneme]
                    );
                    masteredPhonemes.push(phoneme);
                }

                if (summary.fail_streak === 3) {
                    ragTriggerPhonemes.push(phoneme);
                }
            }

            for (const phoneme of masteredPhonemes) {
                await this.addXP(userId, XP_PHONEME_MASTERED, 'phoneme_mastered');
            }

            return { masteredPhonemes, ragTriggerPhonemes };
        } catch (error) {
            throw new Error(`Failed to log phoneme scores: ${error.message}`);
        }
    }


    logPronunciationAttempt = async (userId, data) => {
        try {
            const { testId, questionId, attemptType, wordId, phraseId, score, feedback, isCorrect } = data;

            // Check if test_progress row exists, otherwise create it
            const selectProgress = `
                SELECT id FROM test_progress
                WHERE user_id = $1 AND test_id = $2 AND status = 'IN PROGRESS'
                LIMIT 1;
            `;
            let progressRes = await this.db_connection.query_executor(selectProgress, [userId, testId]);
            let attemptId = progressRes.rows[0]?.id;

            if (!attemptId) {
                const insertProgress = `
                    INSERT INTO test_progress (user_id, test_id, status)
                    VALUES ($1, $2, 'IN PROGRESS')
                    RETURNING id;
                `;
                const newProgress = await this.db_connection.query_executor(insertProgress, [userId, testId]);
                attemptId = newProgress.rows[0].id;
            }

            // Insert into pronunciation_attempts
            const insertAttempt = `
                INSERT INTO pronunciation_attempts (attempt_id, question_id, attempt_type, word_id, phrase_id, accuracy_score, feedback, is_correct)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id;
            `;
            await this.db_connection.query_executor(insertAttempt, [
                attemptId,
                questionId,
                attemptType,
                wordId,
                phraseId,
                score,
                feedback,
                isCorrect
            ]);

            // Update test_progress status to EVALUATED and save score
            const updateProgress = `
                UPDATE test_progress
                SET completed_at = NOW(),
                    score = $1,
                    obtained_marks = $2,
                    status = 'EVALUATED'
                WHERE id = $3;
            `;
            await this.db_connection.query_executor(updateProgress, [score, Math.round(score), attemptId]);

            // Add XP for completing a test
            await this.addXP(userId, 30, 'test_complete');

            return true;
        } catch (error) {
            throw new Error(`Failed to log pronunciation attempt: ${error.message}`);
        }
    }
}

module.exports = ProgressModel