# 🚀 Деплой MedicalBrothers на Vercel

Пошаговая инструкция по развертыванию проекта на Vercel с PostgreSQL базой данных.

## 📋 Требования

- Аккаунт на [Vercel](https://vercel.com)
- Аккаунт на [Vercel Postgres](https://vercel.com/storage/postgres) или другой PostgreSQL хостинг
- GitHub репозиторий с проектом

## 🗄️ Шаг 1: Настройка базы данных

### Вариант A: Vercel Postgres (рекомендуется)

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Перейдите в раздел **Storage**
3. Нажмите **Create Database** → выберите **Postgres**
4. Выберите регион (ближайший к вашим пользователям)
5. Нажмите **Create**
6. После создания скопируйте строку подключения `DATABASE_URL`

### Вариант B: Внешняя PostgreSQL (Supabase, Railway, Neon)

#### Supabase

1. Создайте проект на [Supabase](https://supabase.com)
2. Перейдите в **Settings** → **Database**
3. Скопируйте **Connection String** (URI format)
4. Замените `[YOUR-PASSWORD]` на ваш пароль

#### Neon

1. Создайте проект на [Neon](https://neon.tech)
2. Скопируйте connection string из дашборда
3. Используйте pooled connection для Vercel

#### Railway

1. Создайте проект на [Railway](https://railway.app)
2. Добавьте PostgreSQL service
3. Скопируйте DATABASE_URL из variables

## 🔧 Шаг 2: Настройка переменных окружения

### Обязательные переменные

Подготовьте следующие переменные окружения:

```env
# Database (обязательно!)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Application
NEXT_PUBLIC_APP_URL=https://ваш-домен.vercel.app
NODE_ENV=production

# Security (сгенерируйте надежный секрет!)
SESSION_SECRET=your-super-secret-random-string-min-32-chars

# AI (если используете Qwen API вместо Ollama)
QWEN_API_KEY=your_qwen_api_key
QWEN_MODEL=qwen-turbo

# CORS (добавьте ваш домен)
ALLOWED_ORIGINS=https://ваш-домен.vercel.app,https://www.ваш-домен.com
```

### Опциональные переменные

```env
# Email notifications (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# SMS notifications (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Redis (опционально для production)
REDIS_URL=redis://default:password@redis-host:6379
```

### Генерация SESSION_SECRET

Используйте один из способов:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32

# Online
https://www.random.org/strings/
```

## 📦 Шаг 3: Импорт проекта в Vercel

### Через веб-интерфейс

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Нажмите **Add New** → **Project**
3. Импортируйте ваш GitHub репозиторий
4. Настройте проект:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (корень проекта)
   - **Build Command**: `npm run build` (автоматически)
   - **Output Directory**: `.next` (автоматически)

### Через Vercel CLI

```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите в аккаунт
vercel login

# Деплой проекта
vercel --prod
```

## 🔐 Шаг 4: Добавление переменных окружения

### В веб-интерфейсе

1. В настройках проекта перейдите в **Settings** → **Environment Variables**
2. Добавьте каждую переменную:
   - **Name**: название переменной (например, `DATABASE_URL`)
   - **Value**: значение
   - **Environment**: выберите `Production`, `Preview`, `Development`
3. Нажмите **Save**

### Через CLI

```bash
# Добавить переменную
vercel env add DATABASE_URL production

# Импорт из .env файла
vercel env pull .env.production
```

## 🗃️ Шаг 5: Инициализация базы данных

После первого деплоя необходимо применить миграции Prisma:

### Вариант A: Через Vercel CLI

```bash
# Подключитесь к production окружению
vercel env pull .env.production

# Примените миграции
npx prisma migrate deploy

# Или push схему (для development)
npx prisma db push

# Заполните БД тестовыми данными (опционально)
npx prisma db seed
```

### Вариант B: Автоматически при деплое

Добавьте в `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

**Важно**: Для автоматических миграций DATABASE_URL должен быть доступен во время build time.

## 🚀 Шаг 6: Деплой

### Автоматический деплой

Vercel автоматически деплоит:
- **Production**: при push в ветку `main`
- **Preview**: при создании Pull Request

### Ручной деплой

```bash
# Production деплой
vercel --prod

# Preview деплой
vercel
```

## ✅ Шаг 7: Проверка деплоя

После успешного деплоя проверьте:

1. **Health Check**: `https://ваш-домен.vercel.app/api/health`
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "version": "1.0.0"
   }
   ```

2. **Главная страница**: `https://ваш-домен.vercel.app`

3. **API Documentation**: `https://ваш-домен.vercel.app/api/docs`

4. **Админ панель**: `https://ваш-домен.vercel.app/admin/login`
   - Логин: `admin`
   - Пароль: `admin123` (измените в production!)

## 🔧 Настройка домена

### Добавить custom domain

1. В настройках проекта → **Domains**
2. Нажмите **Add Domain**
3. Введите ваш домен (например, `medical.example.com`)
4. Следуйте инструкциям для настройки DNS

### Настройка DNS

Добавьте в DNS вашего домена:

```
Type: CNAME
Name: www (или medical)
Value: cname.vercel-dns.com
```

Или для root domain:

```
Type: A
Name: @
Value: 76.76.21.21
```

## 📊 Мониторинг

### Vercel Analytics

1. Включите в настройках проекта → **Analytics**
2. Бесплатно до 100k page views/месяц

### Логи

Просмотр логов:
```bash
vercel logs --prod
```

Или в веб-интерфейсе: **Deployments** → выберите деплой → **Logs**

## 🐛 Troubleshooting

### База данных не подключается

**Проблема**: `Error: Can't reach database server`

**Решение**:
1. Проверьте `DATABASE_URL` в переменных окружения
2. Убедитесь, что `?sslmode=require` добавлен в конец URL
3. Проверьте whitelist IP в настройках БД (для Vercel нужен доступ со всех IP)

### Prisma не генерируется

**Проблема**: `@prisma/client` not found

**Решение**:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Превышен лимит serverless function

**Проблема**: `FUNCTION_PAYLOAD_TOO_LARGE`

**Решение**:
1. Оптимизируйте зависимости
2. Используйте `output: 'standalone'` в `next.config.js`
3. Перейдите на Vercel Pro для увеличения лимитов

### WebSocket не работает

**Важно**: Vercel Serverless Functions не поддерживают WebSocket!

**Решение**:
1. Используйте отдельный WebSocket сервер (например, на Railway, Fly.io)
2. Или используйте Vercel Edge Functions (ограниченная поддержка)
3. Для production рекомендуется отдельный WS сервер

### CORS ошибки

**Проблема**: CORS policy blocking requests

**Решение**:
Добавьте ваш домен в `ALLOWED_ORIGINS`:
```env
ALLOWED_ORIGINS=https://ваш-домен.vercel.app,https://www.ваш-домен.com
```

## 🔒 Безопасность Production

### Чеклист перед запуском

- [ ] Смените пароль администратора по умолчанию
- [ ] Сгенерируйте уникальный `SESSION_SECRET`
- [ ] Настройте HTTPS (автоматически на Vercel)
- [ ] Включите CORS только для вашего домена
- [ ] Настройте rate limiting
- [ ] Включите мониторинг и алерты
- [ ] Настройте регулярные бэкапы БД
- [ ] Проверьте все переменные окружения
- [ ] Удалите тестовые данные из БД
- [ ] Настройте реальные SMTP/SMS провайдеры

## 📈 Оптимизация для Production

### Включите кэширование

```typescript
// next.config.js
module.exports = {
  experimental: {
    ppr: true,
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, must-revalidate',
        },
      ],
    },
  ],
}
```

### Настройте Image Optimization

Vercel автоматически оптимизирует изображения через `next/image`.

### Включите компрессию

Автоматически включена на Vercel.

## 💰 Pricing

### Vercel Free Tier (Hobby)

- 100 GB bandwidth
- 100 GB-hours serverless function execution
- 6000 build minutes
- Unlimited websites

### Vercel Pro ($20/месяц)

- 1 TB bandwidth
- 1000 GB-hours
- Unlimited builds
- Team collaboration

### Vercel Postgres

- Free: 256 MB storage, 60 compute hours/месяц
- Pro: $20/месяц за 512 MB
- Enterprise: custom pricing

## 🎉 Готово!

Ваше приложение развернуто и доступно по адресу:

**🌐 https://ваш-домен.vercel.app**

### Следующие шаги

1. Настройте мониторинг ошибок (Sentry)
2. Подключите аналитику (Google Analytics, Plausible)
3. Настройте CI/CD для автоматического тестирования
4. Настройте staging окружение
5. Документируйте процесс для команды

## 📞 Поддержка

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **GitHub Issues**: https://github.com/Saaayurii/MedicalBrothers/issues

---

Сделано с ❤️ для MedicalBrothers
