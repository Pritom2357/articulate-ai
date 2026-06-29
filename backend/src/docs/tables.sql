------------ Users & Auth -----------
create table users(
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(254) UNIQUE NOT NULL,
  phone VARCHAR(11) UNIQUE NOT NULL,
  profile_photo TEXT,
  gender VARCHAR(10)
    CHECK(gender IN ('MALE', 'FEMALE', 'NON-BINARY')),
  role VARCHAR(5)
    CHECK(role IN ('ADMIN', 'USER')) NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT now(),
  password_hash CHAR(60) NOT NULL,
  updated_at TIMESTAMP DEFAULT now(),
  mic_verified BOOLEAN DEFAULT FALSE,
  mic_quality_score FLOAT
);

ALTER TABLE users ADD COLUMN guide_preference VARCHAR(6)
  CHECK(guide_preference IN ('MALE', 'FEMALE')) DEFAULT 'MALE';
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN refresh_token TEXT;
ALTER TABLE users ADD COLUMN last_login TIMESTAMP DEFAULT now();
ALTER TABLE users ADD COLUMN date_of_birth DATE;


CREATE TABLE onboarding_assessments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessed_level VARCHAR(20) NOT NULL, -- e.g. 'A1', 'A2', 'B1'
  vocab_score FLOAT,
  pronunciation_score FLOAT,           -- 0-100
  ai_notes TEXT,                       -- AI feedback summary
  assessed_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-------------- Curriculum -----------------
CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  title_bn VARCHAR(255) NOT NULL,
  order_num INTEGER UNIQUE NOT NULL,
  skill_type VARCHAR(20) NOT NULL CHECK(skill_type IN ('READING', 'LISTENING', 'SPEAKING', 'MIXED')),
  description TEXT NOT NULL,
  conversation_key_points JSONB NOT NULL DEFAULT '[]'
);
ALTER TABLE chapters ADD COLUMN desc_audio_m TEXT; -- male guide audio for chapter description
ALTER TABLE chapters ADD COLUMN desc_audio_f TEXT; -- female guide audio for chapter description


CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_bn VARCHAR(255) NOT NULL,
  order_num INTEGER NOT NULL,
  objective_bn TEXT,
  type VARCHAR(20) NOT NULL CHECK(type IN ('LEARN', 'PRACTICE', 'TEST', 'REVIEW')),
  UNIQUE(chapter_id, order_num)
);


CREATE TABLE words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(50) NOT NULL UNIQUE,
  bangla_meaning TEXT NOT NULL,
  frequency_rank INTEGER NOT NULL,
  difficulty_level VARCHAR(20) DEFAULT 'BEGINNER'
    CHECK(difficulty_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  ipa VARCHAR(100),
  syllables VARCHAR(100),
  audio_url TEXT,    -- female voice (en-US-JennyNeural)
  audio_url_m TEXT   -- male voice   (en-US-AndrewNeural)
);


CREATE TABLE phrases (
  id SERIAL PRIMARY KEY,
  phrase_en VARCHAR(300) NOT NULL UNIQUE,
  phrase_bn VARCHAR(400) NOT NULL,
  audio_url TEXT,    -- female voice (en-US-JennyNeural)
  audio_url_m TEXT,  -- male voice   (en-US-AndrewNeural)
  difficulty VARCHAR(20) DEFAULT 'BEGINNER'
    CHECK(difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED'))
);


--------- junction tables -------------
CREATE TABLE lesson_words (
  code SERIAL PRIMARY KEY,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  -- position INTEGER,
  UNIQUE(word_id, lesson_id)
);

CREATE TABLE lesson_phrases (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  phrase_id INTEGER NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
  UNIQUE(lesson_id, phrase_id)
);


------------- Tests -------------

CREATE TABLE tests (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  skill_type VARCHAR(20) NOT NULL CHECK(skill_type IN ('READING', 'LISTENING', 'SPEAKING', 'MIXED')),
  difficulty_level INT, -- 1 to 5
  total_marks INTEGER,
  time_limit_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE test_questions (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_text_bn TEXT NOT NULL,
  question_type VARCHAR(30) NOT NULL CHECK(
    question_type IN ('MCQ', 'TRUE/FALSE', 'GAP FILLING', 'SHORT ANSWER', 'SPOKEN PROMPT')
  ),
  options JSONB DEFAULT '[]',
  correct_answer JSONB,
  marks INTEGER DEFAULT 1,
  order_num INTEGER NOT NULL,
  difficulty_level INT, -- 1 to 5
  audio_url TEXT,
  UNIQUE(test_id, order_num)
);


CREATE TABLE test_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  score NUMERIC(5,2),
  obtained_marks INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'IN PROGRESS'
    CHECK(status IN ('IN PROGRESS', 'SUBMITTED', 'EVALUATED')),
  attempt_no INTEGER DEFAULT 1
);


CREATE TABLE test_attempts (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES test_progress(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  -- answer_text was dropped, audio_url added instead
  answer_json JSONB,
  is_correct BOOLEAN,
  marks_awarded INTEGER DEFAULT 0,
  feedback TEXT,
  audio_url TEXT,
  UNIQUE(attempt_id, question_id)
);


CREATE TABLE pronunciation_attempts (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES test_progress(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  attempt_type VARCHAR(10) NOT NULL CHECK(attempt_type IN ('WORD', 'PHRASE')),
  word_id INTEGER REFERENCES words(id),
  phrase_id INTEGER REFERENCES phrases(id),
  audio_url TEXT,
  accuracy_score FLOAT,
  feedback TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  attempted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  -- make sure at least one reference is always filled
  CHECK(
    (attempt_type = 'WORD' AND word_id IS NOT NULL) OR
    (attempt_type = 'PHRASE' AND phrase_id IS NOT NULL)
  )
);


------- Progress & Gamification --------------

CREATE TABLE user_progress (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_active DATE,
  placement_chapter INTEGER DEFAULT 1
);


CREATE TABLE user_lesson_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status VARCHAR(12) NOT NULL DEFAULT 'NOT STARTED'
    CHECK(status IN ('NOT STARTED', 'IN PROGRESS', 'COMPLETED')),
  completion_pct FLOAT DEFAULT 0,
  score INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  last_attempted_at TIMESTAMP,
  UNIQUE(user_id, lesson_id)
);


CREATE TABLE user_word_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  familiarity VARCHAR(20) NOT NULL DEFAULT 'NEW'
    CHECK(familiarity IN ('NEW', 'LEARNING', 'FAMILIAR', 'MASTERED')),
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  last_reviewed TIMESTAMP,
  -- SRS (spaced repetition) fields
  streak INTEGER NOT NULL DEFAULT 0,
  easiness FLOAT NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  next_review DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, word_id)
);


-- tracks every XP gain event per user (used for notifications and progress chart)
CREATE TABLE user_xp_log (
  log_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);


------ saved/starred words per user ----------
CREATE TABLE word_bookmarks (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  saved_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, word_id)
);


------------ Badges ------------

CREATE TABLE badges (
  badge_id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  icon_url TEXT
);

-- user earned badges
CREATE TABLE user_badges (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id VARCHAR NOT NULL REFERENCES badges(badge_id) ON DELETE CASCADE,
  earned_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, badge_id)
);


--------- Notifications ------------

CREATE TABLE notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK(type IN (
    'XP_EARNED', 'BADGE_UNLOCKED', 'LESSON_COMPLETE', 'CHAPTER_COMPLETE',
    'TEST_COMPLETE', 'STREAK_MILESTONE', 'LEVEL_UP', 'SYSTEM', 'GENERAL'
  )),
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  sent_time TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(10) NOT NULL DEFAULT 'UNREAD'
    CHECK(status IN ('READ', 'UNREAD')),
  multicast INTEGER -- group ID for broadcasting one notification to many users
);

CREATE INDEX IF NOT EXISTS idx_notif_multicast ON notifications(multicast) WHERE multicast IS NOT NULL;



---------- IELTS Open Conversation ----------

CREATE TABLE IF NOT EXISTS conversation_sessions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id  INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  topic       TEXT NOT NULL,
  status      VARCHAR(6) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'ENDED')),
  report      JSONB,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at    TIMESTAMPTZ
);


CREATE TABLE IF NOT EXISTS conversation_turns (
  id            SERIAL PRIMARY KEY,
  session_id    INTEGER NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  speaker       VARCHAR(4) NOT NULL CHECK(speaker IN ('user', 'ai')),
  transcript    TEXT,
  pron_score    INTEGER,
  fluency_score INTEGER,
  words         JSONB,
  phonemes      JSONB,
  turn_index    INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_turns_session ON conversation_turns(session_id, turn_index);


CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY,
	"session_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_messages_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


CREATE TABLE "chat_sessions" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);


---------- phonemes (added from addPhonemeTables.js) ----------
CREATE TABLE IF NOT EXISTS user_phoneme_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phoneme VARCHAR(10) NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  word_id INTEGER REFERENCES words(id) ON DELETE SET NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);
alter table user_phoneme_scores add column phrase_id INTEGER REFERENCES phrases(id) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS user_phoneme_summary (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phoneme VARCHAR(10) NOT NULL,
  avg_score FLOAT NOT NULL DEFAULT 0,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  fail_streak INTEGER NOT NULL DEFAULT 0,
  mastered BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, phoneme)
);


--------------- exam system ---------------------

CREATE SCHEMA "public";
CREATE TYPE "exam_type" AS ENUM('LESSON', 'CHAPTER', 'PROGRESS', 'IELTS', 'PRACTICE');
CREATE TYPE "exam_status" AS ENUM('GENERATING', 'READY', 'IN_PROGRESS', 'SUBMITTED', 'EVALUATING', 'EVALUATED', 'FAILED');
CREATE TYPE "question_section" AS ENUM('LISTENING', 'SPEAKING');
CREATE TYPE "question_item_type" AS ENUM('WORD', 'PHRASE');

CREATE TABLE "exams" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"exam_type" exam_type NOT NULL,
	"status" exam_status DEFAULT 'GENERATING' NOT NULL,
	"lesson_id" integer,
	"chapter_id" integer,
	"title" varchar(255) NOT NULL,
	"title_bn" varchar(255),
	"total_marks" integer DEFAULT 0 NOT NULL,
	"time_limit_seconds" integer DEFAULT 1200,
	"difficulty_level" integer DEFAULT 3,
	"obtained_marks" numeric(6, 2),
	"score_pct" numeric(5, 2),
	"listening_score" numeric(5, 2),
	"speaking_score" numeric(5, 2),
	"feedback_bn" text,
	"awards_xp" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"submitted_at" timestamp,
	"evaluated_at" timestamp,
	CONSTRAINT "exams_difficulty_level_check" CHECK (((difficulty_level >= 1) AND (difficulty_level <= 5)))
);

ALTER TABLE "exams" ADD CONSTRAINT "exams_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL;
ALTER TABLE "exams" ADD CONSTRAINT "exams_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL;
ALTER TABLE "exams" ADD CONSTRAINT "exams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;


CREATE TABLE "exam_questions" (
	"id" serial PRIMARY KEY,
	"exam_id" integer NOT NULL UNIQUE,
	"section" question_section NOT NULL,
	"item_type" question_item_type NOT NULL,
	"order_num" integer NOT NULL UNIQUE,
	"text_en" varchar(500) NOT NULL,
	"text_bn" varchar(500),
	"audio_url" text,
	"ipa" varchar(200),
	"marks" integer DEFAULT 1 NOT NULL,
	"difficulty" integer DEFAULT 3,
	"word_id" integer,
	"phrase_id" integer,
	CONSTRAINT "exam_questions_exam_id_order_num_key" UNIQUE("exam_id","order_num"),
	CONSTRAINT "exam_questions_difficulty_check" CHECK (((difficulty >= 1) AND (difficulty <= 5)))
);

ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE;
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_phrase_id_fkey" FOREIGN KEY ("phrase_id") REFERENCES "phrases"("id") ON DELETE SET NULL;
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE SET NULL;


CREATE TABLE "exam_answers" (
	"id" serial PRIMARY KEY,
	"exam_id" integer NOT NULL UNIQUE,
	"question_id" integer NOT NULL UNIQUE,
	"typed_answer" text,
	"audio_url" text,
	"audio_buffer" bytea,
	"is_correct" boolean,
	"marks_awarded" numeric(4, 2) DEFAULT '0',
	"accuracy_score" numeric(5, 2),
	"feedback" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exam_answers_exam_id_question_id_key" UNIQUE("exam_id","question_id")
);

ALTER TABLE "exam_answers" ADD CONSTRAINT "exam_answers_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE;
ALTER TABLE "exam_answers" ADD CONSTRAINT "exam_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "exam_questions"("id") ON DELETE CASCADE;



----------------- indexes -----------------

CREATE INDEX "idx_chat_messages_session" ON "chat_messages" ("session_id","created_at");
CREATE INDEX "idx_conv_turns_session" ON "conversation_turns" ("session_id","turn_index");
CREATE UNIQUE INDEX "exam_answers_exam_id_question_id_key" ON "exam_answers" ("exam_id","question_id");
CREATE UNIQUE INDEX "exam_questions_exam_id_order_num_key" ON "exam_questions" ("exam_id","order_num");
CREATE INDEX "idx_exams_type" ON "exams" ("exam_type");
CREATE INDEX "idx_exams_user_status" ON "exams" ("user_id","status");
CREATE UNIQUE INDEX "lesson_phrases_lesson_id_phrase_id_key" ON "lesson_phrases" ("lesson_id","phrase_id");
CREATE UNIQUE INDEX "lesson_words_word_id_lesson_id_key" ON "lesson_words" ("word_id","lesson_id");
CREATE UNIQUE INDEX "lessons_chapter_id_order_num_key" ON "lessons" ("chapter_id","order_num");
CREATE INDEX "idx_notif_multicast" ON "notifications" ("multicast");
CREATE UNIQUE INDEX "phrases_phrase_en_key" ON "phrases" ("phrase_en");
CREATE UNIQUE INDEX "test_attempts_attempt_id_question_id_key" ON "test_attempts" ("attempt_id","question_id");
CREATE UNIQUE INDEX "test_questions_test_id_order_num_key" ON "test_questions" ("test_id","order_num");
CREATE UNIQUE INDEX "user_lesson_progress_user_id_lesson_id_key" ON "user_lesson_progress" ("user_id","lesson_id");
CREATE INDEX "idx_user_
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE;
ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "conversation_turns" ADD CONSTRAINT "conversation_turns_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "conversation_sessions"("id") ON DELETE CASCADE;phoneme_scores_user" ON "user_phoneme_scores" ("user_id");
CREATE UNIQUE INDEX "user_word_progress_user_id_word_id_key" ON "user_word_progress" ("user_id","word_id");
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users" ("phone");
CREATE UNIQUE INDEX "words_word_key" ON "words" ("word");