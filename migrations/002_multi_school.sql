-- Berbilang sekolah: pentadbir platform, status sekolah, tetapan tahap setiap sekolah.
ALTER TABLE schools ADD COLUMN active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1));
ALTER TABLE users ADD COLUMN is_platform_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_platform_admin IN (0,1));

-- Dunia, struktur tahap dan bank soalan kongsi dikawal oleh pentadbir platform.
-- Setiap sekolah boleh mengatasi (override) tetapan berikut; NULL = ikut nilai lalai tahap.
CREATE TABLE school_level_settings (
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  level_id INTEGER NOT NULL REFERENCES game_levels(id) ON DELETE CASCADE,
  pass_percent INTEGER CHECK (pass_percent IS NULL OR pass_percent BETWEEN 40 AND 100),
  num_questions INTEGER CHECK (num_questions IS NULL OR num_questions BETWEEN 3 AND 30),
  time_limit_sec INTEGER CHECK (time_limit_sec IS NULL OR time_limit_sec = 0 OR time_limit_sec BETWEEN 5 AND 600), -- 0 = tiada had masa
  bonus_points INTEGER CHECK (bonus_points IS NULL OR bonus_points BETWEEN 0 AND 5000),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (school_id, level_id)
);

-- Pentadbir pertama pada pangkalan data sedia ada menjadi pentadbir platform.
UPDATE users SET is_platform_admin = 1 WHERE id = (SELECT MIN(id) FROM users WHERE role = 'pentadbir');
