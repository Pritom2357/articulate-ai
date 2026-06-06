create table users(
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT null,
  email VARCHAR(30) UNIQUE NOT null,
  phone VARCHAR(11) unique NOT NULL,
  profile_photo TEXT,
  gender VARCHAR(10) check(gender in ('MALE', 'FEMALE', 'NON-BINARY')),
  age INT,
  role VARCHAR(5) check(role in ('ADMIN', 'USER')) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT now(),
  password_hash CHAR(60) NOT NULL,
  updated_at TIMESTAMP DEFAULT now(),
  mic_verified BOOLEAN DEFAULT FALSE,
  mic_quality_score FLOAT,
  guide_prefernce varchar(6) check (guide_preference in ('MALE', 'FEMALE'))
)

CREATE TABLE onboarding_assessments (
  id serial PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessed_level VARCHAR(20) NOT NULL,                 -- e.g. 'A1', 'A2', 'B1'
  vocab_score FLOAT,
  pronunciation_score  FLOAT,                                -- 0-100
  ai_notes            TEXT,                                 -- AI feedback summary
  assessed_at         TIMESTAMP NOT NULL DEFAULT NOW()
);


CREATE TABLE user_progress (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_active DATE,
  placement_chapter INTEGER DEFAULT 1
);



CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  title_bn VARCHAR(255) NOT NULL,
  order_num INTEGER UNIQUE NOT NULL,
  skill_type VARCHAR(20) NOT NULL CHECK (skill_type IN ('READING', 'LISTENING', 'SPEAKING', 'MIXED')),
  description TEXT NOT NULL,
  conversation_key_points JSONB NOT NULL DEFAULT '[]'
);
alter table chapters ADD desc_audio_m TEXT;
alter table chapters ADD desc_audio_f TEXT;


CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_bn VARCHAR(255) NOT NULL,
  order_num INTEGER NOT NULL,
  objective_bn TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('LEARN', 'PRACTICE', 'TEST', 'REVIEW')),
  UNIQUE (chapter_id, order_num)
);


CREATE TABLE words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(50) NOT NULL UNIQUE,
  bangla_meaning TEXT NOT NULL,
  frequency_rank INTEGER NOT NULL,
  difficulty_level VARCHAR(20) check (difficulty_level in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')) DEFAULT 'BEGINNER',
  ipa VARCHAR(100),
  syllables VARCHAR(100),
  audio_url TEXT
);


CREATE TABLE lesson_words (
  code SERIAL PRIMARY KEY,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  -- position INTEGER,
  UNIQUE (word_id, lesson_id)
);


CREATE TABLE user_word_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  familiarity VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (familiarity IN ('NEW', 'LEARNING', 'FAMILIAR', 'MASTERED')),
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  last_reviewed  TIMESTAMP,
  UNIQUE (user_id, word_id)
);


CREATE TABLE user_lesson_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status VARCHAR(12) NOT NULL DEFAULT 'NOT STARTED' 
    CHECK (status IN ('NOT STARTED', 'IN PROGRESS', 'COMPLETED')),
  completion_pct  FLOAT DEFAULT 0,
  score INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  last_attempted_at TIMESTAMP,
  UNIQUE (user_id, lesson_id)
);


CREATE TABLE tests (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  skill_type VARCHAR(20) NOT NULL CHECK (skill_type IN ('READING', 'LISTENING', 'SPEAKING', 'MIXED')),
  difficulty_level INT, -- like 1 to 5
  total_marks INTEGER,
  time_limit_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);


   id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_text_bn TEXT NOT NULL,
  question_type VARCHAR(30) NOT NULL CHECK (
    question_type IN ('MCQ', 'TRUE/FALSE', 'GAP FILLING', 'SHORT ANSWER', 'SPOKEN PROMPT')
  ),
  options JSONB DEFAULT '[]',
  correct_answer JSONB,
  marks INTEGER DEFAULT 1,
  order_num INTEGER NOT NULL,
  difficulty_level INT, -- like 1 to 5
  audio_url TEXT,
  UNIQUE (test_id, order_num)
);



CREATE TABLE pronunciation_attempts (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_type VARCHAR(10) NOT NULL CHECK (attempt_type IN ('WORD', 'PHRASE')),
  word_id integer REFERENCES words(id),
  sentence_test_id integer REFERENCES test_questions(id),
  audio_url text,
  accuracy_score FLOAT,
  feedback TEXT,
  passed BOOLEAN DEFAULT FALSE,
  attempted_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- make sure at least one reference is always filled
  CHECK (
    (attempt_type = 'WORD' AND word_id IS NOT NULL) OR
    (attempt_type = 'SENTENCE' AND sentence_test_id IS NOT NULL)
  )
);


CREATE TABLE test_attempts (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES test_progress(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_json JSONB,
  is_correct BOOLEAN,
  marks_awarded INTEGER DEFAULT 0,
  feedback TEXT,
  UNIQUE (attempt_id, question_id)
);
alter table test_attempts drop column answer_text;
alter table test_attempts add audio_url text;

CREATE TABLE test_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  score NUMERIC(5,2),
  obtained_marks INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'IN PROGRESS'
    CHECK (status IN ('IN PROGRESS', 'SUBMITTED', 'EVALUATED')),
  attempt_no INTEGER DEFAULT 1
);



CREATE TABLE phrases (
  id SERIAL PRIMARY KEY,
  phrase_en VARCHAR(300) NOT NULL UNIQUE,
  phrase_bn VARCHAR(400) NOT NULL, 
  audio_url TEXT, 
  difficulty VARCHAR(20) DEFAULT 'BEGINNER' CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED'))
);


-- Link phrases to lessons (same pattern as lesson_words)
CREATE TABLE lesson_phrases (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  phrase_id INTEGER NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
  UNIQUE (lesson_id, phrase_id)
);


CREATE TABLE pronunciation_attempts (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES test_progress(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  attempt_type VARCHAR(10) NOT NULL CHECK (attempt_type IN ('WORD', 'PHRASE')),
  word_id INTEGER REFERENCES words(id),
  phrase_id INTEGER REFERENCES phrases(id),
  audio_url TEXT,
  accuracy_score FLOAT,
  feedback TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  attempted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (
    (attempt_type = 'WORD' AND word_id IS NOT NULL)  OR
    (attempt_type = 'PHRASE' AND phrase_id IS NOT NULL)
  )
);


