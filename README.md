# 🏥 MedicalBrothers - Медицинский Голосовой Помощник

> Интеллектуальный голосовой помощник для медицинской клиники с AI-консультациями, видеоконсультациями, записью на приём и полноценной системой управления

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748)](https://www.prisma.io/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33)](https://playwright.dev/)

## 📋 Обзор

MedicalBrothers - это production-ready система для медицинских клиник с полным спектром функций:

### Базовые функции
- 📅 **Запись на приём** - автоматическая запись к врачам с проверкой доступности
- 🩺 **AI-консультации** - предварительная оценка симптомов с рекомендациями (Qwen 2.5)
- ℹ️ **Справочная информация** - режим работы, цены, услуги клиники
- 🚨 **Экстренные вызовы** - фиксация срочных обращений с приоритетом
- 🎤 **Голосовой интерфейс** - распознавание речи и синтез ответов
- 👨‍⚕️ **Админ-панель** - управление врачами, расписанием и записями

### Продвинутые функции
- 🎥 **WebRTC Видеоконсультации** - peer-to-peer видеосвязь с врачами
- 💬 **WebSocket Чат** - real-time переписка в комнатах
- 📁 **Загрузка документов** - медицинские файлы с preview
- 🔐 **Полноценная аутентификация** - регистрация и вход для пациентов
- 🔔 **Push-уведомления** - Web Push API для браузеров
- 📧 **Email & SMS** - автоматические напоминания (Nodemailer, Twilio)
- 📊 **Аналитика** - метрики и статистика в реальном времени
- ⭐ **Система лояльности** - баллы и уровни для пациентов
- 🧪 **Интеграция с лабораториями** - заказы и результаты анализов
- 📋 **Электронная медкарта** (EHR) - полная история пациента
- ⭐ **Отзывы и рейтинги** - оценка врачей пациентами

### Production-ready
- 🐳 **Docker Compose** - для локальной разработки и деплоя
- 🔄 **CI/CD Pipeline** - автоматическое тестирование и деплой (GitHub Actions)
- 🛡️ **Security Headers** - CSP, CORS, XSS protection
- 📈 **Health Check** - мониторинг состояния системы
- 🚦 **Rate Limiting** - защита от DDoS
- 📝 **Audit Logging** - логирование всех админ действий
- 📖 **Swagger API** - автодокументация API
- 📱 **PWA** - установка как приложение
- 🎨 **SEO** - оптимизация для поисковиков

## 🚀 Быстрый старт

> **Windows пользователи:** См. подробную инструкцию [DOCKER_WINDOWS_SETUP.md](DOCKER_WINDOWS_SETUP.md)

### Предварительные требования

- Docker и Docker Compose
- Node.js 22+ (для разработки)
- NVIDIA GPU (опционально, для ускорения AI)

### Установка и запуск

1. **Клонируйте репозиторий:**
```bash
git clone https://github.com/Saaayurii/MedicalBrothers.git
cd MedicalBrothers
```

2. **Запустите с помощью Docker Compose:**
```bash
# Создайте .env файл
cp .env.example .env

# Запустите все сервисы
docker-compose up -d

# Инициализируйте Ollama с моделью Qwen
bash scripts/init-ollama.sh
```

3. **Откройте приложение:**
- 🌐 Главная страница: http://localhost:3000
- 👨‍💼 Админ-панель: http://localhost:3000/admin
- 🗄️ pgAdmin: http://localhost:5050

### Разработка

```bash
# Установите зависимости
npm install

# Запустите базу данных и Ollama
docker-compose up -d postgres ollama

# Инициализируйте Ollama с Qwen
bash scripts/init-ollama.sh

# Запустите dev-сервер
npm run dev
```

Или используйте автоматический скрипт:
```bash
bash scripts/setup-dev.sh
```

### Установка Piper TTS (опционально, для лучшей озвучки)

Piper TTS - это **100% бесплатная** альтернатива для голосовой озвучки с высоким качеством.

#### Установка:

1. **Создайте виртуальное окружение и установите Piper:**
```bash
# Создание venv
python3 -m venv venv

# Активация (Linux/Mac)
source venv/bin/activate

# Установка Piper
pip install piper-tts
```

2. **Скачайте русскую модель:**
```bash
# Создайте директорию для моделей
mkdir -p models

# Скачайте модель (выберите один из вариантов):

# Вариант A: Через wget
cd models
wget https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx.json
cd ..

# Вариант B: Через curl
curl -L -o models/ru_RU-ruslan-medium.onnx \
  https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx
curl -L -o models/ru_RU-ruslan-medium.onnx.json \
  https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx.json
```

3. **Проверьте установку:**
```bash
# Активируйте venv (если еще не активировано)
source venv/bin/activate

# Проверьте, что Piper установлен
which piper

# Проверьте, что модель скачана
ls -lh models/ru_RU-ruslan-medium.onnx
```

4. **Запустите сервер:**
```bash
# Piper TTS будет автоматически использован для озвучки
npm run dev
```

#### Как это работает:

1. При голосовом запросе система **сначала пытается** использовать Web Speech API (встроенный в браузер)
2. Если Web Speech API недоступен или не работает, **автоматически переключается** на Piper TTS через endpoint `/api/voice/piper-speak`
3. Piper генерирует аудио файл (.wav) и отправляет его клиенту
4. Никаких API ключей не требуется - полностью бесплатно!

#### Преимущества Piper TTS:

✅ **100% бесплатно** - без API ключей, без подписок
✅ **Высокое качество** - естественная русская речь
✅ **Работает offline** - не требует интернета
✅ **Быстрая генерация** - ~1-2 секунды на предложение
✅ **Приватность** - все данные остаются на вашем сервере

#### Альтернативные модели:

Если хотите попробовать другие русские голоса:
```bash
# Женский голос Irina (легкий, быстрый)
wget https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx

# Мужской голос Dmitri (более тяжелый, но качественнее)
wget https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/dmitri/medium/ru_RU-dmitri-medium.onnx
```

Все доступные модели: https://github.com/rhasspy/piper/blob/master/VOICES.md

### База данных (Prisma)

Проект использует Prisma ORM для типобезопасной работы с PostgreSQL.

```bash
# Сгенерировать Prisma Client
npm run prisma:generate

# Применить схему к БД (для разработки)
npm run db:push

# Заполнить БД тестовыми данными
npm run prisma:seed

# Открыть Prisma Studio (GUI для БД)
npm run prisma:studio  # http://localhost:5555

# Создать миграцию
npm run prisma:migrate
```

**Первый запуск с БД:**
```bash
# 1. Запустите PostgreSQL
docker-compose up -d postgres

# 2. Примените схему
npm run db:push

# 3. Заполните тестовыми данными
npm run prisma:seed

# 4. Готово! Запускайте приложение
npm run dev
```

## 🏗️ Архитектура

### Технологический стек

#### Frontend
- **Next.js 16** - React фреймворк с PPR (Partial Prerendering)
- **React 19** - UI библиотека с Server Components
- **TypeScript** - типизация и безопасность кода
- **Tailwind CSS** - утилитарный CSS фреймворк
- **Web Speech API** - распознавание и синтез речи

#### Backend
- **Next.js Server Actions** - серверные функции
- **PostgreSQL 16** - реляционная база данных
- **Prisma ORM** - типобезопасная работа с БД
- **Ollama + Qwen 2.5** - локальная AI модель

#### Инфраструктура
- **Docker & Docker Compose** - контейнеризация
- **Prisma Studio** - GUI для управления БД
- **pgAdmin** - администрирование БД (опционально)

### Структура проекта

```
MedicalBrothers/
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions
│   │   └── voice.ts       # Обработка голосовых команд
│   ├── admin/             # Админ-панель
│   │   └── page.tsx       # Страница админки
│   ├── globals.css        # Глобальные стили
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Главная страница
├── components/            # React компоненты
│   ├── admin/            # Компоненты админки
│   │   ├── AppointmentsList.tsx
│   │   ├── DoctorsList.tsx
│   │   ├── EmergencyCalls.tsx
│   │   └── Statistics.tsx
│   ├── ConversationHistory.tsx
│   ├── Header.tsx
│   └── VoiceAssistant.tsx
├── lib/                  # Библиотеки и утилиты
│   ├── db.ts            # PostgreSQL клиент
│   ├── db-schema.sql    # Схема БД
│   └── ollama.ts        # Ollama AI клиент
├── scripts/             # Скрипты настройки
│   ├── init-ollama.sh   # Инициализация AI
│   └── setup-dev.sh     # Настройка разработки
├── docker-compose.yml   # Docker конфигурация
├── Dockerfile           # Production образ
└── next.config.ts       # Next.js конфигурация
```

## 💾 База данных

### Схема базы данных

```sql
-- Основные таблицы:
doctors              -- Врачи клиники
doctor_schedules     -- Расписание врачей
time_slots           -- Временные слоты для записи
patients             -- Пациенты
appointments         -- Записи на приём
consultations        -- История консультаций
emergency_calls      -- Экстренные вызовы
clinic_info          -- Справочная информация
conversation_logs    -- Логи диалогов
```

### Инициализация БД

База данных автоматически инициализируется при первом запуске Docker Compose. Схема находится в `lib/db-schema.sql` и включает:

- Создание всех таблиц с индексами
- Вставку тестовых данных (8 врачей)
- Настройку расписаний
- Добавление справочной информации

## 🤖 AI и обработка голоса

### Ollama с Qwen 2.5

Проект использует локальную AI модель Qwen 2.5 через Ollama для:

1. **Анализ намерений** - определение, что хочет пользователь
2. **Медицинские консультации** - предварительная оценка симптомов
3. **Генерация ответов** - естественные диалоги
4. **Извлечение сущностей** - имена врачей, специальности, даты

### Голосовой интерфейс

#### Распознавание речи (Speech-to-Text)
- Web Speech API (Chrome, Edge)
- Русский язык по умолчанию
- Режим реального времени

#### Синтез речи (Text-to-Speech)

Поддерживается 2 варианта озвучки:

**1. Web Speech Synthesis API (по умолчанию)**
- Встроенный в браузер TTS
- Автоматическое озвучивание ответов
- Настраиваемая скорость и тон
- Работает без дополнительной настройки

**2. Piper TTS (100% бесплатно, лучшее качество)**
- Высококачественная русская озвучка
- Полностью бесплатно (без API ключей)
- Работает offline
- Автоматический fallback, если Web Speech API недоступен

## 🎨 Дизайн

### Футуристичная тема

Проект использует современный киберпанк/неон дизайн:

- **Цветовая палета**: Cyan, Blue, Purple, Pink градиенты
- **Эффекты**: Glow, holographic, blur
- **Анимации**: Pulse, float, wave
- **Кастомные компоненты**: cyber-card, neon-button, voice-wave

### Responsive Design

Полностью адаптивный интерфейс:
- Mobile: одноколоночный layout
- Tablet: двухколоночный grid
- Desktop: оптимизированный многоколоночный

## 📊 Функционал

### 1. Голосовая запись на приём

**Пример диалога:**
```
Пациент: "Хочу записаться к кардиологу"
Система: "У нас доступны: Иван Петров и Мария Сидорова. Кого предпочитаете?"
Пациент: "Иван Петров"
Система: "Есть слоты: понедельник 10:00, 11:30 или вторник 14:00"
```

**Возможности:**
- Поиск врачей по специальности
- Проверка свободных слотов
- Автоматическая запись в БД
- Подтверждение записи

### 2. AI консультация по симптомам

**Пример:**
```
Пациент: "У меня болит голова три дня, светобоязнь"
Система: [Анализирует симптомы]
"Симптомы похожи на мигрень. Рекомендую посетить невролога.
Записать вас на приём?"
```

**Оценка:**
- Анализ симптомов
- Определение срочности
- Рекомендация специалиста
- Общие советы

### 3. Справочная информация

Автоматические ответы на:
- Режим работы клиники
- Цены на услуги
- Подготовка к процедурам
- Контактная информация

### 4. Экстренные вызовы

- Приоритетная обработка
- Фиксация в БД
- Уведомление диспетчера
- Статус обработки

### 5. Админ-панель

**Возможности:**
- Просмотр всех записей
- Управление врачами
- Обработка экстренных вызовов
- Статистика и аналитика

## 🔧 Конфигурация

### Переменные окружения (.env)

```env
# Database
DATABASE_URL=postgresql://medical_user:medical_password@localhost:5432/medical_clinic

# Ollama AI
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:latest

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Next.js конфигурация

```typescript
// next.config.ts
experimental: {
  ppr: true,              // Partial Prerendering
  reactCompiler: true,    // React Compiler
}
```

## 🐳 Docker

### Сервисы

1. **postgres** - PostgreSQL 16
2. **ollama** - AI сервер с Qwen
3. **web** - Next.js приложение
4. **pgadmin** - Админ-панель БД

### Команды

```bash
# Запустить все сервисы
docker-compose up -d

# Остановить
docker-compose down

# Просмотр логов
docker-compose logs -f

# Перезапуск
docker-compose restart

# Очистка данных
docker-compose down -v
```

## 📈 Производительность

### Оптимизации

- **PPR (Partial Prerendering)** - быстрая загрузка страниц
- **React Server Components** - минимальный JS на клиенте
- **Database Indexes** - оптимизированные запросы
- **Connection Pooling** - эффективное управление соединениями
- **Локальный AI** - без задержек на API запросы

### Требования к серверу

**Минимальные:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 20GB
- GPU: опционально (для Ollama)

**Рекомендуемые:**
- CPU: 8+ cores
- RAM: 16GB+
- Storage: 50GB SSD
- GPU: NVIDIA с CUDA поддержкой

## 🔐 Безопасность

### Меры безопасности

- Локальная обработка данных (нет облачных API)
- Валидация всех входных данных
- Параметризованные SQL запросы (защита от SQL injection)
- HTTPS в production (рекомендуется)
- Ограничение прав доступа к БД

### Конфиденциальность

- Все медицинские данные хранятся локально
- Нет передачи данных третьим лицам
- Логи диалогов для улучшения сервиса
- Возможность удаления персональных данных

## 🧪 Тестирование

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Проверка типов
npm run type-check

# Lint
npm run lint
```

## 📝 API Documentation

### Swagger UI

После запуска приложения откройте:
- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/swagger

### Аутентификация пациентов

#### `POST /api/auth/patient/register`
Регистрация нового пациента

**Тело запроса:**
```json
{
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "phone": "+79991234567",
  "password": "securepassword",
  "dateOfBirth": "1990-01-15",
  "address": "Москва, ул. Примерная, д. 1"
}
```

**Ответ:**
```json
{
  "message": "Регистрация успешна",
  "patient": {
    "id": 1,
    "name": "Иван Иванов",
    "email": "ivan@example.com",
    "phone": "+79991234567"
  }
}
```

#### `POST /api/auth/patient/login`
Вход пациента

**Тело запроса:**
```json
{
  "identifier": "ivan@example.com",  // email или телефон
  "password": "securepassword"
}
```

#### `POST /api/auth/patient/logout`
Выход пациента

#### `GET /api/auth/patient/me`
Получить информацию о текущем пациенте

**Ответ:**
```json
{
  "patient": {
    "id": 1,
    "name": "Иван Иванов",
    "email": "ivan@example.com",
    "phone": "+79991234567",
    "dateOfBirth": "1990-01-15",
    "address": "Москва, ул. Примерная, д. 1",
    "loyaltyPoints": 150,
    "loyaltyTier": "silver"
  }
}
```

### Врачи

#### `GET /api/doctors`
Получить список всех врачей

#### `GET /api/doctors/online`
Получить список врачей онлайн

#### `POST /api/doctors/heartbeat`
Обновить статус врача (heartbeat для онлайн индикатора)

### Записи на приём

#### `GET /api/appointments`
Получить список записей текущего пациента

#### `POST /api/appointments`
Создать новую запись

**Тело запроса:**
```json
{
  "doctorId": 1,
  "timeSlotId": 123,
  "appointmentDate": "2024-12-20",
  "appointmentTime": "10:00",
  "symptoms": "Головная боль"
}
```

### Загрузка файлов

#### `POST /api/upload`
Загрузить медицинский документ

**Тело запроса:** multipart/form-data

**Ответ:**
```json
{
  "files": [
    {
      "url": "https://storage.example.com/file.pdf",
      "name": "анализ_крови.pdf"
    }
  ]
}
```

### Аналитика

#### `GET /api/analytics/vitals`
Получить основные метрики системы

**Ответ:**
```json
{
  "totalAppointments": 1250,
  "todayAppointments": 45,
  "onlineDoctors": 8,
  "totalPatients": 892
}
```

### Health Check

#### `GET /api/health`
Проверка состояния системы

**Ответ:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-17T12:00:00Z",
  "uptime": 3600,
  "database": "connected",
  "version": "1.0.0"
}
```

### Server Actions

#### `processVoiceCommand(userInput, history)`
Обрабатывает голосовую команду пользователя

**Параметры:**
- `userInput` (string) - текст пользователя
- `history` (Message[]) - история диалога

**Возвращает:** Promise<string> - ответ системы

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта!

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 👥 Авторы

**MedicalBrothers Team**
- GitHub: [@Saaayurii](https://github.com/Saaayurii)

## 🙏 Благодарности

- [Next.js](https://nextjs.org/) - за отличный фреймворк
- [Ollama](https://ollama.ai/) - за локальный AI
- [Qwen](https://github.com/QwenLM/Qwen) - за мощную языковую модель
- [Vercel](https://vercel.com/) - за вдохновение дизайна

## 📞 Поддержка

Возникли вопросы? Создайте [Issue](https://github.com/Saaayurii/MedicalBrothers/issues)

---

**Сделано с ❤️ для улучшения медицинского обслуживания**
