-- ============================================================
-- ARTICULATE AI — CONSOLIDATED DATABASE SCHEMA
-- Reflects the current live DB state (all ALTERs applied)
-- ============================================================


-- ── Users & Auth ─────────────────────────────────────────────

CREATE TABLE users (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(50)  NOT NULL,
  email             VARCHAR(254) NOT NULL UNIQUE,
  phone             VARCHAR(11)  NOT NULL UNIQUE,
  profile_photo     TEXT,
  gender            VARCHAR(10)  CHECK (gender IN ('MALE', 'FEMALE', 'NON-BINARY')),
  role              VARCHAR(5)   NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
  created_at        TIMESTAMP    DEFAULT now(),
  updated_at        TIMESTAMP    DEFAULT now(),
  password_hash     CHAR(60)     NOT NULL,
  mic_verified      BOOLEAN      DEFAULT FALSE,
  mic_quality_score FLOAT,
  guide_preference  VARCHAR(6)   DEFAULT 'MALE' CHECK (guide_preference IN ('MALE', 'FEMALE')),
  is_active         BOOLEAN      DEFAULT TRUE,
  refresh_token     TEXT,
  last_login        TIMESTAMP    DEFAULT now(),
  date_of_birth     DATE
);


CREATE TABLE onboarding_assessments (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessed_level      VARCHAR(20) NOT NULL,  -- e.g. 'A1', 'A2', 'B1'
  vocab_score         FLOAT,
  pronunciation_score FLOAT,                 -- 0–100
  ai_notes            TEXT,
  assessed_at         TIMESTAMP NOT NULL DEFAULT now()
);


-- ── Curriculum ───────────────────────────────────────────────

CREATE TABLE chapters (
  id                      SERIAL PRIMARY KEY,
  title                   VARCHAR(100) NOT NULL,
  title_bn                VARCHAR(255) NOT NULL,
  order_num               INTEGER      NOT NULL UNIQUE,
  skill_type              VARCHAR(20)  NOT NULL CHECK (skill_type IN ('READING', 'LISTENING', 'SPEAKING', 'MIXED')),
  description             TEXT         NOT NULL,
  conversation_key_points JSONB        NOT NULL DEFAULT '[]',
  desc_audio_m            TEXT,   -- male guide audio for chapter description
  desc_audio_f            TEXT    -- female guide audio for chapter description
);


CREATE TABLE lessons (
  id           SERIAL PRIMARY KEY,
  chapter_id   INTEGER      NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  title_bn     VARCHAR(255) NOT NULL,
  order_num    INTEGER      NOT NULL,
  objective_bn TEXT,
  type         VARCHAR(20)  NOT NULL CHECK (type IN ('LEARN', 'PRACTICE', 'TEST', 'REVIEW')),
  UNIQUE (chapter_id, order_num)
);


CREATE TABLE words (
  id               SERIAL PRIMARY KEY,
  word             VARCHAR(50)  NOT NULL UNIQUE,
  bangla_meaning   TEXT         NOT NULL,
  frequency_rank   INTEGER      NOT NULL,
  difficulty_level VARCHAR(20)  DEFAULT 'BEGINNER' CHECK (difficulty_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  ipa              VARCHAR(100),
  syllables        VARCHAR(100),
  audio_url        TEXT
);


CREATE TABLE phrases (
  id         SERIAL PRIMARY KEY,
  phrase_en  VARCHAR(300) NOT NULL UNIQUE,
  phrase_bn  VARCHAR(400) NOT NULL,
  audio_url  TEXT,
  difficulty VARCHAR(20)  DEFAULT 'BEGINNER' CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED'))
);


-- Junction tables linking words/phrases to lessons
CREATE TABLE lesson_words (
  code       SERIAL  PRIMARY KEY,
  word_id    INTEGER NOT NULL REFERENCES words(id)   ON DELETE CASCADE,
  lesson_id  INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE (word_id, lesson_id)
);

CREATE TABLE lesson_phrases (
  id         SERIAL  PRIMARY KEY,
  lesson_id  INTEGER NOT NULL REFERENCES lessons(id)  ON DELETE CASCADE,
  phrase_id  INTEGER NOT NULL REFERENCES phrases(id)  ON DELETE CASCADE,
  UNIQUE (lesson_id, phrase_id)
);


-- ── Tests ────────────────────────────────────────────────────

CREATE TABLE tests (
  id                  SERIAL PRIMARY KEY,
  lesson_id           INTEGER      REFERENCES lessons(id) ON DELETE CASCADE,
  title               VARCHAR(255) NOT NULL,
  skill_type          VARCHAR(20)  NOT NULL CHECK (skill_type IN ('READING', 'LISTENING', 'SPEAKING', 'MIXED')),
  difficulty_level    INTEGER,     -- 1–5
  total_marks         INTEGER,
  time_limit_seconds  INTEGER,
  created_at          TIMESTAMP    DEFAULT now()
);


CREATE TABLE test_questions (
  id               SERIAL PRIMARY KEY,
  test_id          INTEGER     NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_text    TEXT        NOT NULL,
  question_text_bn TEXT        NOT NULL,
  question_type    VARCHAR(30) NOT NULL CHECK (question_type IN ('MCQ', 'TRUE/FALSE', 'GAP FILLING', 'SHORT ANSWER', 'SPOKEN PROMPT')),
  options          JSONB       DEFAULT '[]',
  correct_answer   JSONB,
  marks            INTEGER     DEFAULT 1,
  order_num        INTEGER     NOT NULL,
  difficulty_level INTEGER,    -- 1–5
  audio_url        TEXT,
  UNIQUE (test_id, order_num)
);


CREATE TABLE test_progress (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id        INTEGER      NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  started_at     TIMESTAMP    DEFAULT now(),
  completed_at   TIMESTAMP,
  score          NUMERIC(5,2),
  obtained_marks INTEGER,
  status         VARCHAR(20)  NOT NULL DEFAULT 'IN PROGRESS' CHECK (status IN ('IN PROGRESS', 'SUBMITTED', 'EVALUATED')),
  attempt_no     INTEGER      DEFAULT 1
);


CREATE TABLE test_attempts (
  id            SERIAL PRIMARY KEY,
  attempt_id    INTEGER  NOT NULL REFERENCES test_progress(id)  ON DELETE CASCADE,
  question_id   INTEGER  NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  answer_json   JSONB,
  is_correct    BOOLEAN,
  marks_awarded INTEGER  DEFAULT 0,
  feedback      TEXT,
  audio_url     TEXT,
  UNIQUE (attempt_id, question_id)
);


CREATE TABLE pronunciation_attempts (
  id           SERIAL PRIMARY KEY,
  attempt_id   INTEGER     NOT NULL REFERENCES test_progress(id)  ON DELETE CASCADE,
  question_id  INTEGER     NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  attempt_type VARCHAR(10) NOT NULL CHECK (attempt_type IN ('WORD', 'PHRASE')),
  word_id      INTEGER     REFERENCES words(id),
  phrase_id    INTEGER     REFERENCES phrases(id),
  audio_url    TEXT,
  accuracy_score FLOAT,
  feedback     TEXT,
  is_correct   BOOLEAN     DEFAULT FALSE,
  attempted_at TIMESTAMP   NOT NULL DEFAULT now(),
  CHECK (
    (attempt_type = 'WORD'   AND word_id   IS NOT NULL) OR
    (attempt_type = 'PHRASE' AND phrase_id IS NOT NULL)
  )
);


-- ── Progress & Gamification ──────────────────────────────────

CREATE TABLE user_progress (
  user_id           INTEGER PRIMARY KEY REFERENCES users(id),
  xp                INTEGER DEFAULT 0,
  level             INTEGER DEFAULT 1,
  streak_days       INTEGER DEFAULT 0,
  last_active       DATE,
  placement_chapter INTEGER DEFAULT 1
);


CREATE TABLE user_lesson_progress (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER     NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  lesson_id         INTEGER     NOT NULL REFERENCES lessons(id)  ON DELETE CASCADE,
  status            VARCHAR(12) NOT NULL DEFAULT 'NOT STARTED' CHECK (status IN ('NOT STARTED', 'IN PROGRESS', 'COMPLETED')),
  completion_pct    FLOAT       DEFAULT 0,
  score             INTEGER     DEFAULT 0,
  attempts          INTEGER     DEFAULT 0,
  started_at        TIMESTAMP,
  completed_at      TIMESTAMP,
  last_attempted_at TIMESTAMP,
  UNIQUE (user_id, lesson_id)
);


CREATE TABLE user_word_progress (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER     NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  word_id       INTEGER     NOT NULL REFERENCES words(id)  ON DELETE CASCADE,
  familiarity   VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (familiarity IN ('NEW', 'LEARNING', 'FAMILIAR', 'MASTERED')),
  correct_count INTEGER     NOT NULL DEFAULT 0,
  wrong_count   INTEGER     NOT NULL DEFAULT 0,
  last_reviewed TIMESTAMP,
  -- SRS (spaced repetition) fields
  streak        INTEGER     NOT NULL DEFAULT 0,
  easiness      FLOAT       NOT NULL DEFAULT 2.5,
  interval_days INTEGER     NOT NULL DEFAULT 1,
  next_review   DATE        NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (user_id, word_id)
);


CREATE TABLE user_xp_log (
  log_id     SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount     INTEGER      NOT NULL,
  reason     VARCHAR(100) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT now()
);


CREATE TABLE word_bookmarks (
  user_id  INTEGER   NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  word_id  INTEGER   NOT NULL REFERENCES words(id)  ON DELETE CASCADE,
  saved_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, word_id)
);


-- ── Badges ───────────────────────────────────────────────────

CREATE TABLE badges (
  badge_id   VARCHAR(20)  PRIMARY KEY,
  title      VARCHAR(100) NOT NULL,
  description TEXT,
  xp_reward  INTEGER      NOT NULL DEFAULT 0,
  icon_url   TEXT
);

CREATE TABLE user_badges (
  user_id   INTEGER     NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
  badge_id  VARCHAR     NOT NULL REFERENCES badges(badge_id) ON DELETE CASCADE,
  earned_at TIMESTAMP   NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);
