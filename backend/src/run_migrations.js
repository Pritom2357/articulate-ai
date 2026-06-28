const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const sql = `
DROP TABLE IF EXISTS exam_answers CASCADE;
DROP TABLE IF EXISTS exam_questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TYPE IF EXISTS exam_type CASCADE;
DROP TYPE IF EXISTS exam_status CASCADE;
DROP TYPE IF EXISTS question_section CASCADE;
DROP TYPE IF EXISTS question_item_type CASCADE;

CREATE TYPE exam_type AS ENUM (
  'LESSON',       
  'CHAPTER',      
  'PROGRESS',     
  'IELTS',        
  'PRACTICE'      
);

CREATE TYPE exam_status AS ENUM (
  'GENERATING',   
  'READY',        
  'IN_PROGRESS',  
  'SUBMITTED',    
  'EVALUATING',   
  'EVALUATED',    
  'FAILED'        
);

CREATE TABLE exams (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_type     exam_type NOT NULL,
  status        exam_status NOT NULL DEFAULT 'GENERATING',

  lesson_id     INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
  chapter_id    INTEGER REFERENCES chapters(id) ON DELETE SET NULL,

  title         VARCHAR(255) NOT NULL,
  title_bn      VARCHAR(255),
  total_marks   INTEGER NOT NULL DEFAULT 0,
  time_limit_seconds INTEGER DEFAULT 1200, 
  difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),

  obtained_marks   NUMERIC(6,2),
  score_pct        NUMERIC(5,2),           
  listening_score  NUMERIC(5,2),
  speaking_score   NUMERIC(5,2),
  feedback_bn      TEXT,                   

  awards_xp     BOOLEAN NOT NULL DEFAULT TRUE,  

  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at    TIMESTAMP,
  submitted_at  TIMESTAMP,
  evaluated_at  TIMESTAMP
);

CREATE INDEX idx_exams_user_status ON exams(user_id, status);
CREATE INDEX idx_exams_type ON exams(exam_type);

CREATE TYPE question_section AS ENUM ('LISTENING', 'SPEAKING');
CREATE TYPE question_item_type AS ENUM ('WORD', 'PHRASE');

CREATE TABLE exam_questions (
  id            SERIAL PRIMARY KEY,
  exam_id       INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  section       question_section NOT NULL,        
  item_type     question_item_type NOT NULL,      
  order_num     INTEGER NOT NULL,

  text_en       VARCHAR(500) NOT NULL,            
  text_bn       VARCHAR(500),                     
  audio_url     TEXT,                             
  ipa           VARCHAR(200),                     

  marks         INTEGER NOT NULL DEFAULT 1,
  difficulty    INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),

  word_id       INTEGER REFERENCES words(id) ON DELETE SET NULL,
  phrase_id     INTEGER REFERENCES phrases(id) ON DELETE SET NULL,

  UNIQUE(exam_id, order_num)
);

CREATE TABLE exam_answers (
  id            SERIAL PRIMARY KEY,
  exam_id       INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id   INTEGER NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,

  typed_answer  TEXT,

  audio_url     TEXT,                     
  audio_buffer  BYTEA,                    

  is_correct    BOOLEAN,
  marks_awarded NUMERIC(4,2) DEFAULT 0,
  accuracy_score NUMERIC(5,2),            
  feedback      TEXT,                     

  submitted_at  TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(exam_id, question_id)
);

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK(type IN (
    'XP_EARNED', 'BADGE_UNLOCKED', 'LESSON_COMPLETE', 'CHAPTER_COMPLETE',
    'TEST_COMPLETE', 'STREAK_MILESTONE', 'LEVEL_UP', 'SYSTEM', 'GENERAL',
    'EXAM_EVALUATED'
  ));

CREATE OR REPLACE FUNCTION trg_xp_notification() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reason = 'lesson_complete' THEN
        INSERT INTO notifications (user_id, type, subject, description, metadata)
        VALUES (
            NEW.user_id,
            'LESSON_COMPLETE',
            'Lesson Completed! 📚',
            'লেসন শেষ করে আপনি +' || NEW.amount || ' XP অর্জন করেছেন।',
            jsonb_build_object('xp', NEW.amount)
        );
    ELSIF NEW.reason = 'chapter_complete' THEN
        INSERT INTO notifications (user_id, type, subject, description, metadata)
        VALUES (
            NEW.user_id,
            'CHAPTER_COMPLETE',
            'Chapter Unlocked! 🏆',
            'চ্যাপ্টার সম্পন্ন করে আপনি +' || NEW.amount || ' XP বোনাস পেয়েছেন।',
            jsonb_build_object('xp', NEW.amount)
        );
    ELSIF NEW.reason = 'test_complete' OR NEW.reason = 'test_completed' THEN
        INSERT INTO notifications (user_id, type, subject, description, metadata)
        VALUES (
            NEW.user_id,
            'TEST_COMPLETE',
            'Speaking Evaluation Done! 🎙️',
            'উচ্চারণ পরীক্ষায় অংশ নিয়ে +' || NEW.amount || ' XP অর্জন করেছেন।',
            jsonb_build_object('xp', NEW.amount)
        );
    ELSIF NEW.reason = 'exam_evaluated' THEN
        INSERT INTO notifications (user_id, type, subject, description, metadata)
        VALUES (
            NEW.user_id,
            'EXAM_EVALUATED',
            'Exam Results Ready! 📝',
            'আপনার পরীক্ষার ফলাফল প্রস্তুত! +' || NEW.amount || ' XP অর্জন করেছেন।',
            jsonb_build_object('xp', NEW.amount)
        );
    ELSE
        INSERT INTO notifications (user_id, type, subject, description, metadata)
        VALUES (
            NEW.user_id,
            'XP_EARNED',
            'XP Gained! ⚡',
            'You earned +' || NEW.amount || ' XP for ' || REPLACE(NEW.reason, '_', ' ') || '.',
            jsonb_build_object('xp', NEW.amount, 'reason', NEW.reason)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW vw_user_stats AS
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
    ) AS completed_tests,
    (
        SELECT COUNT(*) FROM test_progress tp
        WHERE tp.user_id = up.user_id AND tp.score = 100
    ) AS perfect_tests,
    (
        SELECT COUNT(*) FROM exams e
        WHERE e.user_id = up.user_id AND e.status = 'EVALUATED'
    ) AS completed_exams
FROM user_progress up;

CREATE OR REPLACE VIEW vw_user_activity_dates AS
(
  SELECT user_id, DATE(completed_at) AS active_date
  FROM user_lesson_progress
  WHERE status = 'COMPLETED' AND completed_at IS NOT NULL
) UNION (
  SELECT user_id, DATE(completed_at) AS active_date
  FROM test_progress
  WHERE completed_at IS NOT NULL
) UNION (
  SELECT user_id, DATE(submitted_at) AS active_date
  FROM exams
  WHERE submitted_at IS NOT NULL
);
`;

async function run() {
  try {
    console.log('Connecting to DB and running migrations...');
    await pool.query(sql);
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

run();
