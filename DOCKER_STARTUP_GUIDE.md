# 🐳 Запуск MedicalBrothers через Docker

## Быстрый старт

```powershell
# 1. Убедитесь что вы на ветке main
git branch --show-current

# 2. Остановить существующие контейнеры
docker-compose down

# 3. Пересобрать контейнеры с новыми изменениями
docker-compose build --no-cache

# 4. Запустить все сервисы
docker-compose up -d

# 5. Посмотреть логи
docker-compose logs -f app
```

---

## 📦 Что включено в Docker Compose?

### 4 сервиса:

1. **postgres** - PostgreSQL 16 база данных
2. **redis** - Redis 7 для кэширования и rate limiting
3. **ollama** - Ollama с моделью Qwen 2.5 7B для AI чата
4. **app** - Next.js 16 приложение

---

## 🚀 Пошаговая инструкция

### Шаг 1: Проверьте что вы на main ветке

```powershell
git branch --show-current
# Должно показать: main
```

Если вы на другой ветке:
```powershell
git checkout main
```

### Шаг 2: Остановите старые контейнеры

```powershell
# Остановить и удалить контейнеры
docker-compose down

# Или с удалением volumes (БД будет очищена!)
docker-compose down -v
```

### Шаг 3: Пересоберите контейнеры

```powershell
# Пересборка без кэша (чтобы точно подтянуть все изменения)
docker-compose build --no-cache

# Или быстрая пересборка с кэшем
docker-compose build
```

**Ожидаемое время**: 5-10 минут (первая сборка дольше)

### Шаг 4: Запустите сервисы

```powershell
# Запуск в фоновом режиме
docker-compose up -d

# Или на переднем плане (чтобы видеть логи)
docker-compose up
```

### Шаг 5: Дождитесь инициализации

```powershell
# Проверить статус всех контейнеров
docker-compose ps

# Должно быть 4 контейнера со статусом "Up (healthy)"
```

**Важно**: Ollama может загружать модель Qwen 2.5 при первом запуске (5-10 минут)

---

## 📍 Доступные URL

| Название | URL | Описание |
|----------|-----|----------|
| **Swagger UI** | http://localhost:3000/api/docs | Интерактивная документация API |
| **OpenAPI JSON** | http://localhost:3000/api/swagger | Спецификация OpenAPI 3.0 |
| **Health Check** | http://localhost:3000/api/health | Проверка работоспособности |
| **Главная** | http://localhost:3000 | Главная страница |
| **Админ панель** | http://localhost:3000/admin | Панель администратора |
| **PostgreSQL** | localhost:5432 | База данных |
| **Redis** | localhost:6379 | Кэш и rate limiting |
| **Ollama** | http://localhost:11434 | AI API (Qwen 2.5) |

---

## 🔍 Проверка работоспособности

### 1. Проверить все контейнеры

```powershell
docker-compose ps
```

Ожидаемый вывод:
```
NAME                          STATUS
medicalbrothers-app           Up (healthy)
medicalbrothers-postgres      Up (healthy)
medicalbrothers-redis         Up (healthy)
medicalbrothers-ollama        Up (healthy)
```

### 2. Проверить API Health

```powershell
curl http://localhost:3000/api/health
```

Или откройте в браузере: http://localhost:3000/api/health

Ожидаемый ответ:
```json
{
  "status": "ok",
  "timestamp": "2024-01-19T10:30:00.000Z",
  "uptime": 123.45,
  "services": {
    "database": "up",
    "redis": "up"
  }
}
```

### 3. Проверить Swagger UI

Откройте в браузере: http://localhost:3000/api/docs

Вы должны увидеть:
- ✅ 16 категорий API
- ✅ 31+ документированных endpoints
- ✅ 10+ схем данных

---

## 📊 Просмотр логов

### Логи всех сервисов

```powershell
docker-compose logs -f
```

### Логи конкретного сервиса

```powershell
# Логи приложения
docker-compose logs -f app

# Логи PostgreSQL
docker-compose logs -f postgres

# Логи Redis
docker-compose logs -f redis

# Логи Ollama
docker-compose logs -f ollama
```

### Последние 100 строк логов

```powershell
docker-compose logs --tail=100 app
```

---

## 🛠️ Управление контейнерами

### Остановка

```powershell
# Остановить все контейнеры
docker-compose stop

# Остановить конкретный сервис
docker-compose stop app
```

### Запуск

```powershell
# Запустить остановленные контейнеры
docker-compose start

# Запустить конкретный сервис
docker-compose start app
```

### Перезапуск

```powershell
# Перезапустить все контейнеры
docker-compose restart

# Перезапустить приложение
docker-compose restart app
```

### Полная остановка и удаление

```powershell
# Остановить и удалить контейнеры (volumes сохраняются)
docker-compose down

# Остановить и удалить контейнеры + volumes (БД будет очищена!)
docker-compose down -v
```

---

## 🗄️ Работа с базой данных

### Подключиться к PostgreSQL

```powershell
docker-compose exec postgres psql -U medicalbrothers -d medical_clinic
```

### Выполнить SQL команду

```powershell
docker-compose exec postgres psql -U medicalbrothers -d medical_clinic -c "SELECT COUNT(*) FROM \"Patient\";"
```

### Сделать бэкап

```powershell
docker-compose exec postgres pg_dump -U medicalbrothers medical_clinic > backup.sql
```

### Восстановить из бэкапа

```powershell
Get-Content backup.sql | docker-compose exec -T postgres psql -U medicalbrothers medical_clinic
```

---

## 🔄 Prisma миграции

### Применить миграции

```powershell
# Войти в контейнер
docker-compose exec app sh

# Внутри контейнера
npx prisma migrate deploy
```

### Создать новую миграцию (для dev)

```powershell
# Остановить app
docker-compose stop app

# Запустить в dev режиме
docker-compose run --rm app npx prisma migrate dev --name название_миграции
```

---

## 🧹 Очистка и пересборка

### Полная очистка Docker

```powershell
# Остановить контейнеры
docker-compose down -v

# Удалить неиспользуемые образы
docker image prune -a

# Удалить volumes
docker volume prune

# Пересобрать с нуля
docker-compose build --no-cache
docker-compose up -d
```

### Очистка только volumes (сброс БД)

```powershell
docker-compose down -v
docker-compose up -d
```

---

## 🎯 Тестирование API через Swagger

### 1. Откройте Swagger UI

http://localhost:3000/api/docs

### 2. Протестируйте регистрацию

1. Найдите `POST /api/auth/patient/register`
2. Нажмите **"Try it out"**
3. Введите данные:
```json
{
  "name": "Тест Тестович",
  "phone": "+79991234567",
  "password": "test123456",
  "email": "test@example.com"
}
```
4. Нажмите **"Execute"**
5. Должен вернуться статус `201 Created`

### 3. Протестируйте AI чат

1. Найдите `POST /api/ai/chat`
2. Нажмите **"Try it out"**
3. Введите:
```json
{
  "message": "У меня болит голова, что делать?"
}
```
4. Нажмите **"Execute"**
5. Получите ответ от Qwen 2.5

---

## 🔧 Troubleshooting

### Проблема: Порт 3000 занят

```powershell
# Изменить порт в .env
echo "APP_PORT=3001" >> .env

# Перезапустить
docker-compose down
docker-compose up -d
```

### Проблема: Ollama не загружается

```powershell
# Проверить логи
docker-compose logs ollama

# Принудительно перезагрузить модель
docker-compose exec ollama ollama pull qwen2.5:7b
```

### Проблема: База данных не инициализируется

```powershell
# Проверить логи
docker-compose logs postgres

# Пересоздать базу
docker-compose down -v
docker-compose up -d postgres
docker-compose exec app npx prisma migrate deploy
```

### Проблема: "Cannot connect to Docker daemon"

```powershell
# Убедитесь что Docker Desktop запущен
# Проверить статус Docker
docker ps
```

### Проблема: Контейнер не становится healthy

```powershell
# Посмотреть детальный статус
docker inspect medicalbrothers-app

# Проверить health check вручную
docker-compose exec app node -e "require('http').get('http://localhost:3000/api/health')"
```

---

## 📚 Полезные команды

```powershell
# Войти внутрь контейнера
docker-compose exec app sh

# Выполнить команду внутри контейнера
docker-compose exec app npm run lint

# Посмотреть использование ресурсов
docker stats

# Посмотреть образы
docker images

# Посмотреть volumes
docker volume ls

# Посмотреть сети
docker network ls
```

---

## 🎨 Примеры curl запросов

### Регистрация пациента

```powershell
curl -X POST http://localhost:3000/api/auth/patient/register `
  -H "Content-Type: application/json" `
  -d '{"name":"Иван Иванов","phone":"+79991234567","password":"test123"}'
```

### AI чат

```powershell
curl -X POST http://localhost:3000/api/ai/chat `
  -H "Content-Type: application/json" `
  -d '{"message":"У меня болит голова"}'
```

### Health check

```powershell
curl http://localhost:3000/api/health
```

---

## 🌟 Что нового после слияния веток

### ✅ Из ветки `swagger-documentation`:
- 📚 Swagger UI с 31+ endpoints
- 📖 16 категорий API
- 📋 10+ схем данных
- 📄 API_DOCUMENTATION.md
- 🚀 DEPLOYMENT_GUIDE.md

### ✅ Из ветки `integrate-repository-files`:
- 🔐 2FA аутентификация
- ✉️ Email верификация
- 🔒 Security настройки

### ✅ Из ветки `test-voice-assistant`:
- 🏠 Улучшенная главная страница
- 🎨 Интеграция всех UI компонентов

---

## 💡 Советы

1. **Используйте `docker-compose up -d`** для запуска в фоне
2. **Смотрите логи** если что-то не работает: `docker-compose logs -f app`
3. **Делайте бэкапы БД** перед `docker-compose down -v`
4. **Используйте Swagger UI** для тестирования API - это быстрее чем curl
5. **Ollama модель загружается долго** при первом запуске (5-10 минут)

---

## ✅ Чеклист для запуска

- [ ] Docker Desktop запущен
- [ ] Вы на ветке `main`
- [ ] Выполнили `docker-compose down`
- [ ] Выполнили `docker-compose build --no-cache`
- [ ] Выполнили `docker-compose up -d`
- [ ] Все 4 контейнера в статусе `Up (healthy)`
- [ ] http://localhost:3000/api/health возвращает `{"status":"ok"}`
- [ ] http://localhost:3000/api/docs показывает Swagger UI
- [ ] Swagger UI показывает 16 категорий API

**Всё готово? Откройте http://localhost:3000/api/docs и начинайте работать! 🚀**

---

## 📞 Поддержка

- **GitHub**: https://github.com/Saaayurii/MedicalBrothers
- **Issues**: https://github.com/Saaayurii/MedicalBrothers/issues
- **Swagger UI**: http://localhost:3000/api/docs
- **API Docs**: `/API_DOCUMENTATION.md`
- **Deployment**: `/DEPLOYMENT_GUIDE.md`
