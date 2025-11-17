# Инструкция по деплою MedicalBrothers на Vercel

## Обзор

Этот проект использует:
- **Next.js 16** - фронтенд и API
- **PostgreSQL** - основная база данных (через Docker локально)
- **Redis** - кеширование (через Docker локально)
- **WebSocket/Socket.IO** - для видеозвонков
- **Vercel** - хостинг для Next.js

## Важно: Особенности деплоя

### 1. PostgreSQL и Redis

Vercel НЕ поддерживает Docker контейнеры. Вам нужно использовать managed сервисы:

#### Рекомендуемые сервисы для PostgreSQL:
- **Vercel Postgres** (встроенный в Vercel)
- **Supabase** (бесплатный tier до 500MB)
- **Neon** (serverless Postgres, бесплатный tier)
- **Railway** (простой деплой, $5/месяц)

#### Рекомендуемые сервисы для Redis:
- **Vercel KV** (встроенный в Vercel, на базе Upstash)
- **Upstash Redis** (serverless Redis, бесплатный tier)
- **Redis Cloud** (managed Redis)

### 2. WebSocket сервер

Vercel serverless функции НЕ поддерживают постоянные WebSocket соединения.

#### Варианты решения:

**Вариант A: Отдельный сервер для WebSocket**
- Деплой Socket.IO сервера на Railway/Render/Fly.io
- Next.js на Vercel
- WebSocket подключение к отдельному серверу

**Вариант B: Managed WebSocket сервис**
- Использовать Pusher/Ably вместо Socket.IO
- Все на Vercel

**Вариант C: Всё на одном сервере (не Vercel)**
- Деплой на Railway/Render/Fly.io/DigitalOcean
- Запуск кастомного сервера через `npm run start:socket`

## Пошаговая инструкция

### Шаг 1: Подготовка баз данных

#### Вариант 1A: Vercel Postgres (рекомендуется)

1. Войдите в Vercel Dashboard
2. Выберите ваш проект
3. Перейдите в Storage → Create Database → Postgres
4. Скопируйте connection string

#### Вариант 1B: Supabase

1. Зарегистрируйтесь на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Перейдите в Settings → Database → Connection string
4. Скопируйте `postgres://` URI в режиме "Session"

#### Вариант 1C: Neon

1. Зарегистрируйтесь на [neon.tech](https://neon.tech)
2. Создайте новый проект
3. Скопируйте connection string

### Шаг 2: Настройка Redis

#### Вариант 2A: Vercel KV (рекомендуется)

1. В Vercel Dashboard → Storage → Create Database → KV
2. Подключите к проекту
3. Environment variables добавятся автоматически

#### Вариант 2B: Upstash

1. Зарегистрируйтесь на [upstash.com](https://upstash.com)
2. Создайте Redis database
3. Скопируйте UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN

### Шаг 3: Миграция данных из Docker

```bash
# 1. Экспорт данных из локального PostgreSQL
docker exec -t your_postgres_container pg_dumpall -c -U postgres > dump.sql

# 2. Импорт в production базу
# Для Vercel Postgres:
psql "postgres://user:pass@host:5432/verceldb?sslmode=require" < dump.sql

# Или используйте Prisma для миграции схемы:
DATABASE_URL="your_production_database_url" npx prisma migrate deploy
DATABASE_URL="your_production_database_url" npx prisma db seed
```

### Шаг 4: Настройка Environment Variables

В Vercel Dashboard → Settings → Environment Variables добавьте:

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..." # Для Prisma (если используете connection pooling)

# Redis (если используете)
REDIS_URL="redis://..."
# Или для Upstash:
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key" # Сгенерируйте: openssl rand -base64 32
NEXTAUTH_URL="https://your-domain.vercel.app"

# Deepgram (голосовой ассистент)
DEEPGRAM_API_KEY="your-deepgram-key"

# OpenAI (AI ассистент)
OPENAI_API_KEY="your-openai-key"

# Stripe (платежи)
STRIPE_SECRET_KEY="sk_..."
STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."

# YooKassa (платежи для РФ)
YOOKASSA_SHOP_ID="your-shop-id"
YOOKASSA_SECRET_KEY="your-secret-key"

# Push уведомления
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:admin@yourdomain.com"

# App URL
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"

# Socket.IO сервер (если отдельный)
NEXT_PUBLIC_SOCKET_URL="https://your-socket-server.com"
```

### Шаг 5: Генерация VAPID ключей для Push-уведомлений

```bash
npx web-push generate-vapid-keys
```

Скопируйте ключи в environment variables.

### Шаг 6: Деплой на Vercel

#### Через GitHub (рекомендуется):

```bash
# 1. Запушьте код в GitHub
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main

# 2. В Vercel Dashboard:
# - New Project
# - Import Git Repository
# - Выберите ваш репозиторий
# - Framework Preset: Next.js
# - Build Command: npm run build
# - Deploy
```

#### Через Vercel CLI:

```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите
vercel login

# Деплой
vercel --prod
```

### Шаг 7: Настройка WebSocket сервера (для видеозвонков)

#### Вариант A: Деплой Socket.IO на Railway

1. Создайте `Procfile`:
```
web: npm run start:socket
```

2. Создайте аккаунт на [railway.app](https://railway.app)

3. Деплой:
```bash
railway login
railway init
railway up
```

4. В Vercel добавьте environment variable:
```env
NEXT_PUBLIC_SOCKET_URL="https://your-app.railway.app"
```

#### Вариант B: Использовать Pusher

1. Зарегистрируйтесь на [pusher.com](https://pusher.com)
2. Создайте Channels app
3. Замените Socket.IO на Pusher в коде
4. Добавьте credentials в environment variables

### Шаг 8: Настройка Custom Domain (опционально)

1. В Vercel Dashboard → Settings → Domains
2. Добавьте ваш домен
3. Настройте DNS записи (A или CNAME)
4. Обновите `NEXTAUTH_URL` и `NEXT_PUBLIC_APP_URL`

### Шаг 9: Настройка Stripe Webhook

1. В Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/payment/webhook`
3. Выберите события:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
4. Скопируйте webhook secret в `STRIPE_WEBHOOK_SECRET`

### Шаг 10: Тестирование

```bash
# Проверьте deployment URL
curl https://your-app.vercel.app/api/health

# Проверьте подключение к БД
# В браузере откройте: https://your-app.vercel.app/api/test-db

# Проверьте логи
vercel logs
```

## Альтернативный вариант: Деплой всего на Railway/Render

Если хотите избежать проблем с WebSocket и использовать Docker:

### Railway:

```bash
# 1. Установите CLI
npm i -g @railway/cli

# 2. Войдите
railway login

# 3. Инициализируйте проект
railway init

# 4. Добавьте PostgreSQL
railway add

# 5. Деплой
railway up
```

### Render:

1. Создайте `render.yaml`:
```yaml
services:
  - type: web
    name: medicalbrothers
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start:socket
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: NODE_ENV
        value: production

databases:
  - name: postgres
    databaseName: medicalbrothers
    user: medicalbrothers
```

2. Подключите GitHub репозиторий
3. Deploy

## Мониторинг и логи

```bash
# Vercel logs
vercel logs --follow

# Railway logs
railway logs

# Проверка статуса
vercel ls
```

## Troubleshooting

### Ошибка: "Cannot connect to database"
- Проверьте `DATABASE_URL` в environment variables
- Убедитесь, что IP Vercel добавлен в whitelist БД
- Для Supabase: используйте connection pooler URL

### Ошибка: "WebSocket connection failed"
- Vercel не поддерживает WebSocket
- Деплойте Socket.IO сервер отдельно

### Ошибка: "Module not found"
- Запустите `npm install` локально
- Проверьте `package.json` dependencies
- Удалите `.next` и пересоберите

### Prisma migration errors
```bash
# Production миграции
DATABASE_URL="your_prod_url" npx prisma migrate deploy
```

## Production Checklist

- [ ] PostgreSQL база данных настроена
- [ ] Redis настроен (если используется)
- [ ] Все environment variables добавлены
- [ ] VAPID ключи сгенерированы
- [ ] Socket.IO сервер задеплоен отдельно (или используется Pusher)
- [ ] Stripe webhook настроен
- [ ] Custom domain настроен
- [ ] SSL/HTTPS включен
- [ ] Prisma migrations применены
- [ ] База данных засеяна (seed data)
- [ ] Мониторинг настроен
- [ ] Логи проверены

## Полезные ссылки

- [Vercel Docs](https://vercel.com/docs)
- [Prisma Deploy](https://www.prisma.io/docs/guides/deployment)
- [Supabase Docs](https://supabase.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Neon Docs](https://neon.tech/docs)
