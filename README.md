# BookKZ — Онлайн жазылу жүйесі

Корпоративтік жоба: барбершоп / сұлулық салонына арналған ішкікорпоративтік онлайн-жазылу жүйесі.

---

## Технологиялар

| Қабат | Технология |
|-------|------------|
| Backend | Node.js + Express.js |
| Database | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| Frontend | Vanilla JS + CSS (SPA, Hash Router) |
| Deploy | Docker + docker-compose / Render / Railway |

---

## Дерекқор схемасы (ERD)

```
users ──┬── masters ──┬── master_services ── services
        │             └── appointments ──────── services
        │                      │
        └── appointments       └── reviews
```

**Кестелер:**
- `users` — пайдаланушылар (admin / master / user)
- `services` — қызметтер (стрижка, маникюр т.б.)
- `masters` — шебер профильдері (users-ке сілтеме)
- `master_services` — шебер ↔ қызмет байланысы (many-to-many)
- `appointments` — жазылымдар
- `reviews` — пікірлер мен бағалар

---

## Жылдам іске қосу

### 1. Docker арқылы (ең оңай)

```bash
git clone https://github.com/YOUR_REPO/booking-app.git
cd booking-app
docker-compose up --build
```

Браузерде: http://localhost:5000

### 2. Қолмен іске қосу

**Алдын ала қажеттілер:** Node.js 18+, PostgreSQL 16

```bash
# 1. Дерекқор жасау
createdb booking_db
psql booking_db -f backend/db/schema.sql

# 2. .env файлы жасау
cd backend
cp .env.example .env
# .env ішінде DATABASE_URL мен JWT_SECRET толтырыңыз

# 3. Тәуелділіктер орнату
npm install

# 4. Іске қосу
npm start
# немесе автоматты перезапуск үшін:
npm run dev
```

---

## REST API сипаттамасы

### Аутентификация

| Метод | Endpoint | Сипаттама | Рұқсат |
|-------|----------|-----------|--------|
| POST | `/api/auth/register` | Тіркелу | Ашық |
| POST | `/api/auth/login` | Кіру, JWT алу | Ашық |
| GET | `/api/auth/me` | Ағымдағы пайдаланушы | Барлығы |

### Қызметтер

| Метод | Endpoint | Рұқсат |
|-------|----------|--------|
| GET | `/api/services` | Ашық |
| POST | `/api/services` | Admin |
| PUT | `/api/services/:id` | Admin |
| DELETE | `/api/services/:id` | Admin |

### Шеберлер

| Метод | Endpoint | Рұқсат |
|-------|----------|--------|
| GET | `/api/masters` | Ашық |
| GET | `/api/masters/:id/schedule?date=YYYY-MM-DD` | Ашық |

### Жазылымдар

| Метод | Endpoint | Рұқсат |
|-------|----------|--------|
| GET | `/api/appointments` | Admin: барлығы; Master: өзінің; User: өзінің |
| POST | `/api/appointments` | Аутентификацияланған |
| PATCH | `/api/appointments/:id/status` | Admin, Master |
| DELETE | `/api/appointments/:id` | Admin, өз жазылымы |

### Пікірлер

| Метод | Endpoint | Рұқсат |
|-------|----------|--------|
| GET | `/api/reviews?master_id=X` | Ашық |
| POST | `/api/reviews` | Аутентификацияланған |

### Админ панелі

| Метод | Endpoint | Рұқсат |
|-------|----------|--------|
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/users` | Admin |
| PATCH | `/api/admin/users/:id` | Admin |

---

## Рөлдік модель

| Функция | User | Master | Admin |
|---------|------|--------|-------|
| Жазылым жасау | ✓ | ✓ | ✓ |
| Өз жазылымдарын көру | ✓ | ✓ | ✓ |
| Клиент жазылымдарын басқару | ✗ | ✓ | ✓ |
| Барлық жазылымдарды көру | ✗ | ✗ | ✓ |
| Қызметтер CRUD | ✗ | ✗ | ✓ |
| Пайдаланушы рөлін өзгерту | ✗ | ✗ | ✓ |
| Статистика | ✗ | ✗ | ✓ |

---

## Тест аккаунттары

```
Admin:  +77001234567 / admin123
Master: +77012345678 / master123
User:   +77034567890 / user123
```

---

## Деплой (Render / Railway)

1. GitHub-қа push жасаңыз
2. Render.com-да:
   - New Web Service → Connect repo
   - Build command: `cd backend && npm install`
   - Start command: `cd backend && node server.js`
   - Env vars: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
3. PostgreSQL Add-on қосыңыз

---

## Апталық прогресс

- **1-апта**: Жобалау, ERD, GitHub repo, дерекқор схемасы ✓
- **2-апта**: PostgreSQL қосылымы, базалық эндпоинттар ✓
- **3-апта**: Толық CRUD, валидация, қате өңдеу ✓
- **4-апта**: JWT аутентификация, рөлдік модель, JOIN сұраулар ✓
- **5-апта**: Фронтенд (SPA), API интеграция ✓
- **6-апта**: Docker деплой, .env баптау ✓
- **7-апта**: Презентация, Live Demo

---

## Авторлар

- Команда мүшесі 1 — Бэкенд, API, Дерекқор
- Команда мүшесі 2 — Фронтенд, UI/UX
- Команда мүшесі 3 — Деплой, Тестілеу, Құжаттама
- Команда мүшесі 4 — Деплой, Тестілеу, Құжаттама
