-- Lencana tambahan. INSERT OR IGNORE: selamat dijalankan pada pangkalan data sedia ada.
INSERT OR IGNORE INTO achievement_badges(code, name, description, icon, criteria_type, criteria) VALUES
  ('penakluk_dunia', 'Penakluk Dunia', 'Tamatkan satu dunia sepenuhnya.', '🌍', 'worlds_completed', '{"count":1}'),
  ('pengumpul_mata', 'Pengumpul Mata', 'Kumpul 1 000 mata seumur hidup.', '💰', 'lifetime_points', '{"count":1000}'),
  ('bintang_emas', 'Bintang Emas', 'Dapat markah penuh 10 kali.', '🥇', 'perfect_scores', '{"count":10}'),
  ('juara_sekolah', 'Juara Sekolah', 'Lulus 50 tahap.', '🏅', 'levels_passed', '{"count":50}');
