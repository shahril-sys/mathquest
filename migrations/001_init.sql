-- MathQuest Adventure: initial schema (SQLite; portable to PostgreSQL with type tweaks)

CREATE TABLE schools (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- roles: murid / guru / pentadbir
CREATE TABLE roles (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,   -- student ID / staff login (never an IC number)
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL REFERENCES roles(code),
  display_name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  must_change_password INTEGER NOT NULL DEFAULT 0,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE auth_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);

CREATE TABLE classes (
  id INTEGER PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 6),
  UNIQUE (school_id, name)
);

CREATE TABLE teachers (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE teacher_classes (
  teacher_id INTEGER NOT NULL REFERENCES teachers(user_id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, class_id)
);

CREATE TABLE students (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 6),
  avatar TEXT NOT NULL DEFAULT 'fox',
  points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  points_lifetime INTEGER NOT NULL DEFAULT 0 CHECK (points_lifetime >= 0),
  setup_done INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_students_class ON students(class_id);

CREATE TABLE mathematics_topics (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id),         -- NULL = shared bank
  topic_id INTEGER NOT NULL REFERENCES mathematics_topics(id),
  year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 6),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('mudah','sederhana','sukar','pakar')),
  qtype TEXT NOT NULL CHECK (qtype IN ('mcq','numeric','fill','word','visual','match','count')),
  text TEXT NOT NULL,
  answer TEXT NOT NULL,                              -- numeric/fill answer, or option index for mcq
  explanation TEXT NOT NULL,
  hint TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL DEFAULT '{}',                   -- JSON: visual spec, match pairs
  time_limit_sec INTEGER CHECK (time_limit_sec IS NULL OR time_limit_sec BETWEEN 5 AND 600),
  active INTEGER NOT NULL DEFAULT 1,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_questions_sel ON questions(topic_id, year, difficulty, active);

CREATE TABLE question_options (
  id INTEGER PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL,
  text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  UNIQUE (question_id, idx)
);

CREATE TABLE game_worlds (
  id INTEGER PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  topic_id INTEGER NOT NULL REFERENCES mathematics_topics(id),
  min_year INTEGER NOT NULL DEFAULT 1 CHECK (min_year BETWEEN 1 AND 6),
  theme TEXT NOT NULL DEFAULT 'forest',
  icon TEXT NOT NULL DEFAULT '🌍',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE game_levels (
  id INTEGER PRIMARY KEY,
  world_id INTEGER NOT NULL REFERENCES game_worlds(id) ON DELETE CASCADE,
  level_no INTEGER NOT NULL CHECK (level_no >= 1),
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'mudah' CHECK (difficulty IN ('mudah','sederhana','sukar','pakar')),
  generators TEXT NOT NULL DEFAULT '[]',              -- JSON array of generator keys
  num_questions INTEGER NOT NULL DEFAULT 10 CHECK (num_questions BETWEEN 3 AND 30),
  pass_percent INTEGER NOT NULL DEFAULT 70 CHECK (pass_percent BETWEEN 40 AND 100),
  time_limit_sec INTEGER CHECK (time_limit_sec IS NULL OR time_limit_sec BETWEEN 5 AND 600),
  bonus_points INTEGER CHECK (bonus_points IS NULL OR bonus_points BETWEEN 0 AND 5000), -- NULL = use system default
  is_boss INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE (world_id, level_no)
);

CREATE TABLE game_sessions (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  level_id INTEGER REFERENCES game_levels(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'level' CHECK (kind IN ('level','daily')),
  daily_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','finished','abandoned')),
  total INTEGER NOT NULL,
  correct INTEGER NOT NULL DEFAULT 0,
  percent INTEGER,
  passed INTEGER,
  pass_percent INTEGER NOT NULL,
  time_limit_sec INTEGER,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT,
  result TEXT                                      -- JSON summary stored once on finish (idempotent replay)
);
CREATE INDEX idx_sessions_student ON game_sessions(student_id, status);

CREATE TABLE session_questions (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL,
  source_question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
  topic_id INTEGER REFERENCES mathematics_topics(id),
  payload TEXT NOT NULL,       -- JSON: public part sent to the client
  secret TEXT NOT NULL,        -- JSON: answer, explanation, hint (never sent before answering)
  started_at TEXT,
  UNIQUE (session_id, idx)
);

CREATE TABLE student_answers (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  idx INTEGER NOT NULL,
  question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
  topic_id INTEGER REFERENCES mathematics_topics(id),
  response TEXT,
  is_correct INTEGER NOT NULL,
  timed_out INTEGER NOT NULL DEFAULT 0,
  hint_used INTEGER NOT NULL DEFAULT 0,
  elapsed_ms INTEGER,
  answered_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (session_id, idx)
);
CREATE INDEX idx_answers_student ON student_answers(student_id, topic_id);

CREATE TABLE student_progress (
  student_id INTEGER NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  level_id INTEGER NOT NULL REFERENCES game_levels(id) ON DELETE CASCADE,
  attempts INTEGER NOT NULL DEFAULT 0,
  best_percent INTEGER NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  passed INTEGER NOT NULL DEFAULT 0,
  passed_at TEXT,
  PRIMARY KEY (student_id, level_id)
);

CREATE TABLE point_transactions (
  id INTEGER PRIMARY KEY,
  tx_uid TEXT NOT NULL UNIQUE,
  student_id INTEGER NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL,                 -- correct_answer, level_complete, perfect_score, world_complete, daily, redeem, refund, adjustment
  balance_delta INTEGER NOT NULL,
  lifetime_delta INTEGER NOT NULL DEFAULT 0,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  lifetime_after INTEGER NOT NULL,
  ref_type TEXT,
  ref_id INTEGER,
  reason TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_points_student ON point_transactions(student_id, created_at);

CREATE TABLE reward_catalog (
  id INTEGER PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🎁',
  image_path TEXT,
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  min_year INTEGER NOT NULL DEFAULT 1 CHECK (min_year BETWEEN 1 AND 6),
  limit_per_student INTEGER CHECK (limit_per_student IS NULL OR limit_per_student > 0),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE reward_inventory (
  reward_id INTEGER PRIMARY KEY REFERENCES reward_catalog(id) ON DELETE CASCADE,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),       -- physical units on hand
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0), -- held for pending/approved requests
  CHECK (reserved <= stock)
);

CREATE TABLE reward_redemptions (
  id INTEGER PRIMARY KEY,
  reference_no TEXT NOT NULL UNIQUE,
  request_id TEXT UNIQUE,                        -- client-generated; makes double submits harmless
  student_id INTEGER NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  reward_id INTEGER NOT NULL REFERENCES reward_catalog(id),
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),
  status TEXT NOT NULL CHECK (status IN ('menunggu','diluluskan','sedia','dituntut','ditolak','dibatalkan')),
  note TEXT,
  decided_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_redemptions_student ON reward_redemptions(student_id);
CREATE INDEX idx_redemptions_status ON reward_redemptions(status);

CREATE TABLE achievement_badges (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('level_pass','worlds_completed','lifetime_points','perfect_scores','levels_passed')),
  criteria TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE student_achievements (
  student_id INTEGER NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES achievement_badges(id) ON DELETE CASCADE,
  earned_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (student_id, badge_id)
);

CREATE TABLE assignments (
  id INTEGER PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  level_id INTEGER NOT NULL REFERENCES game_levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE administrator_audit_logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  role TEXT,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_audit_created ON administrator_audit_logs(created_at);

CREATE TABLE system_settings (
  school_id INTEGER NOT NULL REFERENCES schools(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (school_id, key)
);

INSERT INTO roles(code,name) VALUES ('murid','Murid'),('guru','Guru'),('pentadbir','Pentadbir');
