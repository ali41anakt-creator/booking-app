-- ============================================================
-- BOOKING APP — Database Schema (PostgreSQL)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS (роли: admin, master, user)
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  phone       VARCHAR(20) UNIQUE NOT NULL,
  email       VARCHAR(120) UNIQUE,
  password    TEXT NOT NULL,
  role        VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('admin','master','user')),
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SERVICES (услуги)
CREATE TABLE IF NOT EXISTS services (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  description  TEXT,
  duration_min INT NOT NULL DEFAULT 60,
  price        NUMERIC(10,2) NOT NULL,
  category     VARCHAR(60),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MASTERS (мастера — расширение users с ролью master)
CREATE TABLE IF NOT EXISTS masters (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio         TEXT,
  experience  INT DEFAULT 0,
  rating      NUMERIC(3,2) DEFAULT 5.00,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MASTER_SERVICES (какие услуги оказывает мастер)
CREATE TABLE IF NOT EXISTS master_services (
  master_id   INT NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  service_id  INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (master_id, service_id)
);

-- APPOINTMENTS (записи)
CREATE TABLE IF NOT EXISTS appointments (
  id           SERIAL PRIMARY KEY,
  client_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  master_id    INT NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  service_id   INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  appt_date    DATE NOT NULL,
  appt_time    TIME NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','confirmed','cancelled','completed')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REVIEWS (отзывы)
CREATE TABLE IF NOT EXISTS reviews (
  id             SERIAL PRIMARY KEY,
  appointment_id INT NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  client_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  master_id      INT NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  rating         INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin (password: admin123)
INSERT INTO users (name, phone, email, password, role) VALUES
  ('Администратор', '+77001234567', 'admin@booking.kz',
   crypt('admin123', gen_salt('bf')), 'admin')
ON CONFLICT DO NOTHING;

-- Masters
INSERT INTO users (name, phone, email, password, role) VALUES
  ('Айдар Сейтов', '+77012345678', 'aidar@booking.kz',
   crypt('master123', gen_salt('bf')), 'master'),
  ('Дамир Ахметов', '+77023456789', 'damir@booking.kz',
   crypt('master123', gen_salt('bf')), 'master')
ON CONFLICT DO NOTHING;

-- Regular user
INSERT INTO users (name, phone, email, password, role) VALUES
  ('Асель Нурова', '+77034567890', 'asel@mail.kz',
   crypt('user123', gen_salt('bf')), 'user')
ON CONFLICT DO NOTHING;

-- Services
INSERT INTO services (name, description, duration_min, price, category) VALUES
  ('Мужская стрижка', 'Классическая или модельная стрижка', 45, 3500, 'Барбершоп'),
  ('Борода', 'Оформление и стрижка бороды', 30, 2500, 'Барбершоп'),
  ('Комбо (стрижка + борода)', 'Полный уход', 70, 5500, 'Барбершоп'),
  ('Окрашивание', 'Окрашивание волос', 90, 8000, 'Цвет'),
  ('Маникюр', 'Уход за ногтями', 60, 4000, 'Ногти')
ON CONFLICT DO NOTHING;

-- Masters profiles
INSERT INTO masters (user_id, bio, experience)
  SELECT id, 'Опытный барбер, специализация — классические стрижки', 5
  FROM users WHERE phone = '+77012345678'
ON CONFLICT DO NOTHING;

INSERT INTO masters (user_id, bio, experience)
  SELECT id, 'Мастер универсал, работает с любым типом волос', 3
  FROM users WHERE phone = '+77023456789'
ON CONFLICT DO NOTHING;
