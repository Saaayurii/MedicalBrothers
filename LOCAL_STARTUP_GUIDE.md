# 🚀 Локальный запуск MedicalBrothers

## Быстрый старт

```bash
# 1. Установить зависимости (один раз)
npm install --legacy-peer-deps

# 2. Запустить dev сервер
npm run dev

# 3. Открыть в браузере
open http://localhost:3000/api/docs
```

---

## 📍 Важные URL

| Название | URL | Описание |
|----------|-----|----------|
| **Swagger UI** | http://localhost:3000/api/docs | Интерактивная документация API |
| **OpenAPI JSON** | http://localhost:3000/api/swagger | Спецификация OpenAPI 3.0 |
| **Health Check** | http://localhost:3000/api/health | Проверка работоспособности |
| **Главная** | http://localhost:3000 | Главная страница |
| **Админ панель** | http://localhost:3000/admin | Панель администратора |
| **Панель пациента** | http://localhost:3000/patient | Личный кабинет пациента |

---

## 🎯 Swagger UI - Как использовать

### 1. Просмотр документации
Откройте: http://localhost:3000/api/docs

Вы увидите 16 категорий API:
- 🔐 Authentication (регистрация, вход, выход)
- 🤖 AI & Voice (AI чат, STT, TTS)
- 🏥 Medical Records (электронные медкарты)
- 💳 Payments (Stripe, YooKassa)
- 🔔 Push Notifications
- ⭐ Reviews & Ratings
- 🎁 Loyalty Program
- И другие...

### 2. Тестирование API
1. Выберите endpoint (например, `POST /api/auth/patient/register`)
2. Нажмите **"Try it out"**
3. Введите данные:
```json
{
  "name": "Тест Тестович",
  "phone": "+79991234567",
  "password": "test123456"
}
```
4. Нажмите **"Execute"**
5. Увидите реальный ответ от API

### 3. Просмотр схем
Прокрутите вниз до раздела **"Schemas"** - там все модели данных:
- Patient, Doctor, Appointment
- MedicalRecord, LabOrder, Review
- Payment, LoyaltyPoints, AIResponse
- И другие (15+ схем)

---

## 🛠️ Управление сервером

### Запуск
```bash
npm run dev
```

### Просмотр логов
```bash
tail -f /tmp/next-dev.log

# Или при запуске без фона
npm run dev
```

### Остановка
```bash
# Вариант 1: Ctrl+C (если запущен на переднем плане)
# Вариант 2: Остановить процесс
pkill -f "next dev"
```

### Перезапуск
```bash
# Остановить и запустить заново
pkill -f "next dev" && npm run dev
```

---

## 🔍 Проверка работоспособности

### Быстрая проверка
```bash
curl http://localhost:3000/api/health
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45,
  "services": {
    "database": "up",
    "redis": "down"  // может быть down в dev без Redis
  }
}
```

### Проверка Swagger
```bash
curl http://localhost:3000/api/swagger | jq '.info.title'
```

Должно вывести:
```
"MedicalBrothers API Documentation"
```

---

## 📊 Структура API

### 16 категорий документированных endpoints:

1. **Authentication** (4 endpoints)
   - POST /api/auth/patient/register
   - POST /api/auth/patient/login
   - POST /api/auth/patient/logout
   - GET /api/auth/patient/me

2. **AI & Voice** (4 endpoints)
   - POST /api/ai/chat (Ollama + Qwen 2.5)
   - POST /api/voice/transcribe (Deepgram STT)
   - POST /api/voice/speak (OpenAI TTS)
   - POST /api/voice/chat (GPT-4o-mini)

3. **Medical Records** (2 endpoints)
   - GET /api/medical-records
   - POST /api/medical-records

4. **Lab Orders** (3 endpoints)
   - GET /api/lab-orders
   - POST /api/lab-orders
   - PATCH /api/lab-orders

5. **Reviews** (3 endpoints)
   - GET /api/reviews
   - POST /api/reviews
   - GET /api/reviews/stats

6. **Loyalty** (2 endpoints)
   - GET /api/loyalty
   - POST /api/loyalty

7. **Reminders** (2 endpoints)
   - GET /api/reminders
   - POST /api/reminders

8. **Doctors** (2 endpoints)
   - GET /api/doctors/online
   - POST /api/doctors/heartbeat

9. **Payments** (3 endpoints)
   - POST /api/payment/create
   - GET /api/payment/status
   - POST /api/payment/webhook

10. **Push Notifications** (3 endpoints)
    - GET /api/push/subscribe (VAPID key)
    - POST /api/push/subscribe
    - DELETE /api/push/subscribe

11. **Notifications** (2 endpoints)
    - GET /api/notifications/stream (SSE)
    - POST /api/notifications/send

12. **Analytics** (1 endpoint)
    - GET /api/analytics/vitals

13. **System** (3 endpoints)
    - GET /api/health
    - GET /api/csrf
    - POST /api/upload

14. **Cron Jobs** (1 endpoint)
    - GET /api/cron/send-reminders

**Всего: 31+ документированных endpoints!**

---

## 🔧 Troubleshooting

### Проблема: Порт 3000 занят
```bash
# Найти процесс на порту 3000
lsof -ti:3000

# Убить процесс
kill $(lsof -ti:3000)

# Или использовать другой порт
PORT=3001 npm run dev
```

### Проблема: Ошибки компиляции
```bash
# Очистить кэш Next.js
rm -rf .next

# Переустановить зависимости
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Перезапустить
npm run dev
```

### Проблема: Database ошибки
```bash
# Сгенерировать Prisma Client
npx prisma generate

# Или с миграциями
npx prisma migrate dev
```

### Проблема: Swagger не показывает новые endpoints
```bash
# Очистить кэш и перезапустить
rm -rf .next
npm run dev
```

---

## 📚 Полезные команды

```bash
# Проверить версии
node --version
npm --version

# Посмотреть package.json scripts
npm run

# Запустить тесты (если есть)
npm test

# Линтинг
npm run lint

# Сборка production
npm run build

# Запуск production сборки
npm start
```

---

## 🎨 Примеры использования API

### Регистрация пациента
```bash
curl -X POST http://localhost:3000/api/auth/patient/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Иван Иванов",
    "phone": "+79991234567",
    "password": "securePass123",
    "email": "ivan@example.com"
  }'
```

### AI чат (Ollama)
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "У меня болит голова и температура 38"
  }'
```

### Получить health status
```bash
curl http://localhost:3000/api/health | jq
```

---

## 💡 Советы

1. **Используйте Swagger UI** для тестирования API - это быстрее чем curl
2. **Смотрите логи** при возникновении ошибок: `tail -f /tmp/next-dev.log`
3. **Очищайте .next** если что-то работает странно: `rm -rf .next`
4. **Используйте jq** для красивого форматирования JSON: `curl ... | jq`

---

## 📞 Поддержка

- **GitHub**: https://github.com/Saaayurii/MedicalBrothers
- **Issues**: https://github.com/Saaayurii/MedicalBrothers/issues
- **Документация API**: `/API_DOCUMENTATION.md`
- **Гайд по деплою**: `/DEPLOYMENT_GUIDE.md`

---

## ✅ Чеклист перед началом работы

- [ ] Node.js 20+ установлен
- [ ] npm install выполнен успешно
- [ ] .env файл создан
- [ ] npm run dev запущен без ошибок
- [ ] http://localhost:3000/api/docs открывается
- [ ] Swagger UI показывает 16 категорий API
- [ ] Health check возвращает status

**Всё готово? Откройте http://localhost:3000/api/docs и начинайте работать! 🚀**
