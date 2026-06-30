create or replace view vw_chapters as
SELECT
    id,
    title,
    title_bn,
    order_num,
    skill_type,
    description,
    desc_audio_m,
    desc_audio_f,
    (Select Count(*) From lessons Where chapter_id = chapters.id) AS total_lessons
FROM chapters;


create or replace view vw_due_cards as
select
    uwp.user_id,
    uwp.id AS progress_id,
    uwp.word_id,
    w.word,
    w.bangla_meaning,
    w.ipa,
    w.syllables,
    w.audio_url,
    w.audio_url_m,
    uwp.familiarity,
    uwp.streak,
    uwp.correct_count,
    uwp.wrong_count,
    uwp.easiness,
    uwp.interval_days,
    uwp.next_review,
    w.frequency_rank,
    w.difficulty_level
FROM user_word_progress uwp
JOIN words w ON w.id = uwp.word_id
WHERE uwp.next_review <= CURRENT_DATE;


CREATE OR REPLACE VIEW vw_user_chapter_progress AS
WITH user_progress AS (
    -- progress per user per chapter
    SELECT
        ulp.user_id,
        l.chapter_id,
        COUNT(ulp.lesson_id) AS attempted_lessons,
        COUNT(
            CASE WHEN ulp.status = 'COMPLETED' THEN 1 END
        ) AS completed_lessons,
        SUM(ulp.score) AS total_score,
        SUM(ulp.attempts) AS total_attempts
    FROM user_lesson_progress ulp
    JOIN lessons l ON ulp.lesson_id = l.id
    GROUP BY ulp.user_id, l.chapter_id
)
SELECT 
    u.id AS user_id,
    c.id AS chapter_id,
    c.title AS chapter_title,
    c.order_num AS chapter_order,
    c.total_lessons,
    COALESCE(up.attempted_lessons, 0) AS attempted_lessons,
    COALESCE(up.completed_lessons, 0) AS completed_lessons,
    CASE 
        WHEN c.total_lessons = 0 THEN 0
        ELSE ROUND((COALESCE(up.completed_lessons, 0) * 100.0) / c.total_lessons, 2)
    END AS completion_pct,
    CASE
        WHEN c.total_lessons > 0
            AND COALESCE(up.completed_lessons, 0) = c.total_lessons THEN 'COMPLETED'
        WHEN COALESCE(up.attempted_lessons, 0) > 0 THEN 'IN PROGRESS'
        ELSE 'NOT STARTED'
    END AS status,
    COALESCE(total_score, 0) AS total_score,
    COALESCE(total_attempts, 0) AS total_attempts
FROM users u
CROSS JOIN vw_chapters c
LEFT JOIN user_progress up ON up.user_id = u.id AND up.chapter_id = c.id;


create or replace view vw_user_stats as
SELECT
    up.user_id,
    up.xp,
    up.level,
    up.streak_days,
    up.last_active,
    (
        SELECT COUNT(*) FROM user_lesson_progress lp
        WHERE lp.user_id = up.user_id AND lp.status = 'COMPLETED'
    ) AS completed_lessons,
    (
        SELECT COUNT(*) FROM test_progress tp
        WHERE tp.user_id = up.user_id AND tp.status IN ('SUBMITTED', 'EVALUATED')
    ) + (
        SELECT COUNT(*) FROM exams e
        WHERE e.user_id = up.user_id AND e.status = 'EVALUATED'
    ) AS completed_tests,
    (
        SELECT COUNT(*) FROM test_progress tp
        WHERE tp.user_id = up.user_id AND tp.score = 100
    ) + (
        SELECT COUNT(*) FROM exams e
        WHERE e.user_id = up.user_id AND e.score_pct = 100 AND e.status = 'EVALUATED'
    ) AS perfect_tests
FROM user_progress up;


-- user X user_word_progress X words
create or replace view vw_user_words AS
  SELECT
    uwp.id,
    uwp.user_id,
    uwp.word_id,
    w.word,
    w.bangla_meaning,
    w.ipa,
    w.syllables,
    w.audio_url,
    w.audio_url_m,
    w.difficulty_level,
    w.frequency_rank,
    uwp.familiarity,
    uwp.correct_count,
    uwp.wrong_count,
    uwp.streak,
    uwp.next_review,
    uwp.last_reviewed,
    EXISTS (
        SELECT 1 FROM word_bookmarks wb
        WHERE wb.user_id = uwp.user_id AND wb.word_id = uwp.word_id
    ) AS is_bookmarked
FROM user_word_progress uwp
JOIN words w ON w.id = uwp.word_id
ORDER BY w.word ASC;


-- for montly streak calaender
CREATE OR REPLACE VIEW vw_user_activity_dates AS
(
  SELECT 
    user_id,
    DATE(completed_at) AS active_date
  FROM user_lesson_progress
  WHERE status = 'COMPLETED'
    AND completed_at IS NOT NULL
) UNION (
  SELECT 
      user_id,
      DATE(completed_at) AS active_date
  FROM test_progress
  WHERE completed_at IS NOT NULL
) UNION (
  SELECT
      user_id,
      DATE(completed_at) AS active_date
  FROM exams
  WHERE status = 'EVALUATED' AND completed_at IS NOT NULL
);