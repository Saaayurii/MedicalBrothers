# MedicalBrothers API Documentation

## Полная документация по API медицинской платформы MedicalBrothers

### 📍 Доступ к Swagger UI

- **Development**: http://localhost:3000/api/docs
- **Production**: https://medicalbrothers.vercel.app/api/docs
- **OpenAPI JSON**: /api/swagger

---

## 🔐 Аутентификация

### Patient Authentication
- `POST /api/auth/patient/register` - Регистрация нового пациента (выдает 100 приветственных баллов лояльности)
- `POST /api/auth/patient/login` - Вход пациента (по email или телефону)
- `POST /api/auth/patient/logout` - Выход пациента
- `GET /api/auth/patient/me` - Получить профиль текущего пациента

**Типы сессий**:
- `patient_session` - cookie для пациентов
- `admin_session` - cookie для админов/докторов

---

## 🤖 AI & Voice API

### AI Chat (Ollama + Qwen 2.5)
- `POST /api/ai/chat` - Чат с AI медицинским ассистентом
  - Анализ симптомов
  - Рекомендации специалистов
  - Информация о клинике
  - Rate limit: 100 req/min

### Voice Processing
- `POST /api/voice/transcribe` - Speech-to-Text (Deepgram)
  - Поддержка русского языка
  - Формат: WAV, MP3, M4A, FLAC
  - Confidence score

- `POST /api/voice/speak` - Text-to-Speech (OpenAI TTS)
  - Голос: Alloy
  - Формат: MP3
  - Поддержка русского

- `POST /api/voice/chat` - Голосовая консультация (GPT-4o-mini)
  - Определение намерения записи
  - Детекция специальности
  - Анализ серьезности (normal/high/emergency)

---

## 🏥 Medical Records (EHR)

- `GET /api/medical-records` - Получить медицинские записи
  - Фильтры: patientId, recordType, limit
  - Типы: diagnosis, prescription, lab_result, imaging, note
  - Access control: пациенты видят только свои записи

- `POST /api/medical-records` - Создать медицинскую запись
  - Только для докторов и админов
  - Поддержка вложений
  - Конфиденциальные записи

---

## 🧪 Lab Orders

- `GET /api/lab-orders` - Получить лабораторные заказы
  - Фильтры: patientId, status
  - Статусы: pending, processing, completed, failed

- `POST /api/lab-orders` - Создать лабораторный заказ
  - Приоритеты: routine, urgent, stat
  - Только для докторов/админов

- `PATCH /api/lab-orders` - Обновить статус/результаты

---

## ⭐ Reviews & Ratings

- `GET /api/reviews` - Получить отзывы о докторах
  - Фильтры: doctorId, verified, limit
  - Средний рейтинг и количество

- `POST /api/reviews` - Оставить отзыв
  - Рейтинг: 1-5 звезд
  - Верифицированные отзывы (от завершенных приемов)

- `GET /api/reviews/[id]` - Получить конкретный отзыв
- `GET /api/reviews/stats` - Статистика отзывов

---

## 🎁 Loyalty Program

- `GET /api/loyalty` - Получить баллы лояльности
  - Уровни: Bronze, Silver, Gold, Platinum
  - Пороги: 2000, 5000, 10000 баллов

- `POST /api/loyalty` - Начислить/списать баллы
  - Типы: earned, redeemed, expired, adjusted

- `GET /api/loyalty/transactions` - История транзакций баллов

---

## 📅 Reminders

- `GET /api/reminders` - Получить напоминания о приемах
  - Фильтры: appointmentId, status
  - Типы: email, sms, push

- `POST /api/reminders` - Создать напоминание
  - Планирование времени отправки

---

## 👨‍⚕️ Doctors

- `GET /api/doctors/online` - Список онлайн врачей
  - Real-time статус через heartbeat

- `POST /api/doctors/heartbeat` - Обновить онлайн статус
  - Только для докторов
  - Heartbeat mechanism

---

## 💳 Payments

- `POST /api/payment/create` - Создать платеж
  - Providers: Stripe (международные), YooKassa (РФ)
  - Валюты: RUB, USD, EUR
  - Автоконверсия в копейки/центы

- `GET /api/payment/status` - Проверить статус платежа
- `POST /api/payment/webhook` - Webhook от Stripe
  - Events: payment_intent.succeeded, payment_intent.payment_failed

---

## 🔔 Push Notifications

- `GET /api/push/subscribe` - Получить VAPID public key
- `POST /api/push/subscribe` - Подписаться на push уведомления
  - Web Push API standard
  - Хранение subscription endpoints

- `DELETE /api/push/subscribe` - Отписаться от push
- `POST /api/push/send` - Отправить push уведомление
  - Шаблоны: appointmentReminder, newMessage, videoReady, prescriptionReady

---

## 📊 Notifications & Analytics

- `GET /api/notifications/stream` - Server-Sent Events поток
- `POST /api/notifications/send` - Отправить уведомление

- `GET /api/analytics/vitals` - Системная аналитика
  - Всего приемов
  - Приемы сегодня
  - Онлайн докторов
  - Всего пациентов

---

## ⚙️ System

- `GET /api/health` - Health check
  - Database status (PostgreSQL)
  - Redis status
  - Uptime, version
  - Response time

- `GET /api/csrf` - Получить CSRF token
- `POST /api/upload` - Загрузить медицинский файл
  - Типы: PDF, images, medical files
  - Организация по папкам

- `GET /api/cron/send-reminders` - Автоматическая отправка напоминаний

---

## 📋 Общая статистика

- **Всего эндпоинтов**: 31+
- **Категорий**: 16
- **Схем данных**: 15+ (включая Patient, Doctor, Appointment, MedicalRecord, Review, Loyalty, Payment и др.)

---

## 🔒 Безопасность

- **Authentication**: Cookie-based sessions (patient_session, admin_session)
- **RBAC**: 5 ролей (super_admin, admin, doctor, registrar, nurse)
- **CSRF Protection**: Token-based
- **Rate Limiting**: Upstash Redis
  - AUTH: 10 req/min
  - API Standard: 100 req/min
  - Voice API: специальный лимит

---

## 📚 Схемы данных

### Основные модели:
- **Patient** - пациенты
- **Doctor** - врачи
- **Appointment** - приемы
- **MedicalRecord** - медицинские записи (EHR)
- **LabOrder** - лабораторные заказы
- **Review** - отзывы (1-5 звезд)
- **LoyaltyPoints** - баллы лояльности
- **Reminder** - напоминания
- **Payment** - платежи
- **PushSubscription** - push подписки

---

## 🚀 Начало работы

```bash
# Локальная разработка
npm install
npm run dev

# Откройте Swagger UI
open http://localhost:3000/api/docs
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# AI Services
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_BASE_URL=http://localhost:11434
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
YOOKASSA_SHOP_ID=...
YOOKASSA_SECRET_KEY=...

# Push Notifications
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:...

# Email & SMS
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

---

## 📞 Контакты

- **GitHub**: https://github.com/Saaayurii/MedicalBrothers
- **Support**: support@medicalbrothers.ru
- **License**: MIT

---

**Примечание**: Полная интерактивная документация доступна по адресу `/api/docs` со всеми примерами запросов и ответов.
