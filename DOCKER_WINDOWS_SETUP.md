# 🐳 Docker Setup для Windows - Medical Voice Assistant

## Почему Docker?

Docker решает проблемы, с которыми вы столкнулись:
- ✅ Нет EBUSY ошибок (файлы не блокируются Windows)
- ✅ Нет ECONNRESET при скачивании Prisma
- ✅ Всё работает изолированно в контейнерах
- ✅ Одинаковое поведение на любой ОС

---

## 📥 Шаг 1: Установка Docker Desktop для Windows

### 1.1 Системные требования

- **Windows 10/11** (64-bit)
- **WSL 2** (Windows Subsystem for Linux)
- **4GB RAM** минимум (8GB+ рекомендуется)
- **Включенная виртуализация** в BIOS

### 1.2 Скачивание Docker Desktop

1. Перейдите на: https://www.docker.com/products/docker-desktop
2. Нажмите **"Download for Windows"**
3. Скачается файл `Docker Desktop Installer.exe` (~500 MB)

### 1.3 Установка Docker Desktop

1. **Запустите** `Docker Desktop Installer.exe` **от имени администратора**
2. Убедитесь что **включены** обе опции:
   - ✅ **Use WSL 2 instead of Hyper-V** (рекомендуется)
   - ✅ **Add shortcut to desktop**
3. Нажмите **"Ok"** и дождитесь установки (5-10 минут)
4. После установки **перезагрузите компьютер**

### 1.4 Первый запуск

1. Откройте **Docker Desktop** из меню Пуск
2. Примите лицензионное соглашение
3. Можете **пропустить** регистрацию (Skip)
4. Дождитесь, пока Docker Engine запустится (индикатор внизу станет зелёным)

---

## ✅ Шаг 2: Проверка установки

Откройте **PowerShell** или **Command Prompt** и выполните:

```powershell
# Проверка версии Docker
docker --version
# Ожидается: Docker version 24.x.x или выше

# Проверка Docker Compose
docker compose version
# Ожидается: Docker Compose version v2.x.x

# Проверка что Docker работает
docker run hello-world
# Должно скачать образ и вывести "Hello from Docker!"
```

Если все команды выполнились успешно - **Docker готов к работе!** 🎉

---

## 🚀 Шаг 3: Запуск Medical Voice Assistant

### 3.1 Клонирование репозитория (если ещё не сделали)

```powershell
git clone https://github.com/Saaayurii/MedicalBrothers.git
cd MedicalBrothers
```

### 3.2 Настройка .env файла

```powershell
# Скопируйте пример конфигурации
copy .env.example .env
```

Файл `.env` уже содержит правильные настройки для Docker:
```env
DATABASE_URL=postgresql://medical_user:medical_password@localhost:5432/medical_clinic
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:latest
```

### 3.3 Запуск базы данных PostgreSQL

```powershell
# Запустите PostgreSQL в фоновом режиме
docker compose up -d postgres

# Проверьте что контейнер запустился
docker compose ps

# Подождите 5 секунд пока БД инициализируется
timeout /t 5
```

### 3.4 Применение схемы Prisma (БЕЗ npm install!)

**Вариант A: Через Docker (рекомендуется)**

```powershell
# Запустите Prisma команды внутри Docker контейнера
docker compose run --rm web npx prisma generate
docker compose run --rm web npx prisma db push
docker compose run --rm web npx prisma db seed
```

**Вариант B: Локально (если npm работает)**

```powershell
npm install
npm run db:push
npm run prisma:seed
```

### 3.5 Запуск Ollama (AI модель)

```powershell
# Запустите Ollama сервис
docker compose up -d ollama

# Подождите 10 секунд пока контейнер запустится
timeout /t 10

# Загрузите модель Qwen 2.5 (это займёт 5-10 минут)
docker compose exec ollama ollama pull qwen2.5:latest
```

**Примечание:** Модель весит ~4GB, загрузка зависит от скорости интернета.

### 3.6 Запуск веб-приложения

**Вариант A: В Docker (полная изоляция)**

```powershell
# Соберите и запустите приложение
docker compose up -d web

# Посмотрите логи приложения
docker compose logs -f web
```

**Вариант B: Локально (быстрее для разработки)**

```powershell
# БД и Ollama уже в Docker, Next.js локально
npm run dev
```

---

## 🎉 Готово! Откройте приложение

- 🌐 **Главная страница:** http://localhost:3000
- 👨‍💼 **Админ-панель:** http://localhost:3000/admin
- 🗄️ **Prisma Studio:** http://localhost:5555 (после `npm run prisma:studio`)

---

## 🛠️ Полезные Docker команды для Windows

### Управление сервисами

```powershell
# Запустить все сервисы
docker compose up -d

# Запустить только определённые сервисы
docker compose up -d postgres ollama

# Остановить все сервисы
docker compose down

# Остановить и удалить все данные (осторожно!)
docker compose down -v

# Перезапустить сервис
docker compose restart postgres
```

### Просмотр логов

```powershell
# Логи всех сервисов
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f postgres
docker compose logs -f ollama
docker compose logs -f web

# Последние 100 строк логов
docker compose logs --tail=100 postgres
```

### Проверка статуса

```powershell
# Список запущенных контейнеров
docker compose ps

# Использование ресурсов (CPU, RAM)
docker stats

# Подробная информация о контейнере
docker inspect medicalbrothers-postgres-1
```

### Выполнение команд в контейнерах

```powershell
# Подключиться к PostgreSQL
docker compose exec postgres psql -U medical_user -d medical_clinic

# Выполнить SQL запрос
docker compose exec postgres psql -U medical_user -d medical_clinic -c "SELECT COUNT(*) FROM doctors;"

# Зайти в shell контейнера
docker compose exec postgres bash

# Проверить модели Ollama
docker compose exec ollama ollama list
```

### Очистка системы

```powershell
# Удалить неиспользуемые образы
docker image prune -a

# Удалить неиспользуемые volume
docker volume prune

# Полная очистка Docker (осторожно!)
docker system prune -a --volumes
```

---

## 🐛 Решение проблем

### Проблема 1: "Docker Desktop is not running"

**Решение:**
1. Откройте **Docker Desktop** из меню Пуск
2. Дождитесь пока индикатор станет зелёным
3. Повторите команду

### Проблема 2: "Port 5432 already in use"

**Решение:** У вас уже запущен PostgreSQL локально

```powershell
# Остановите локальный PostgreSQL через Services
services.msc
# Найдите PostgreSQL и остановите

# Или измените порт в docker-compose.yml
ports:
  - "5433:5432"  # Вместо 5432:5432
```

### Проблема 3: "WSL 2 installation is incomplete"

**Решение:**

```powershell
# Откройте PowerShell от имени администратора
wsl --install

# Перезагрузите компьютер
```

### Проблема 4: Контейнер не запускается

```powershell
# Посмотрите логи с ошибками
docker compose logs postgres

# Пересоздайте контейнер
docker compose down
docker compose up -d postgres
```

### Проблема 5: "Cannot connect to Docker daemon"

**Решение:**
1. Убедитесь что Docker Desktop запущен
2. В Docker Desktop: Settings → General → "Use the WSL 2 based engine" (включено)
3. Перезапустите Docker Desktop

---

## 💡 Рекомендации для Windows

### 1. Используйте WSL 2 (а не Hyper-V)

WSL 2 быстрее и потребляет меньше ресурсов.

### 2. Храните проект в WSL файловой системе

Для максимальной производительности:

```powershell
# Зайдите в WSL
wsl

# Клонируйте репозиторий в WSL
cd ~
git clone https://github.com/Saaayurii/MedicalBrothers.git
cd MedicalBrothers

# Работайте отсюда
docker compose up -d
```

### 3. Выделите больше ресурсов Docker

Docker Desktop → Settings → Resources:
- **CPU:** минимум 2 ядра (4+ рекомендуется)
- **Memory:** минимум 4GB (8GB+ рекомендуется)
- **Disk:** минимум 20GB

### 4. Включите File Sharing

Docker Desktop → Settings → Resources → File Sharing:
- Добавьте диск `C:\` (или где лежит проект)

---

## 🔥 Быстрые команды (шпаргалка)

```powershell
# Полный запуск проекта
docker compose up -d

# Проверка статуса
docker compose ps

# Просмотр логов
docker compose logs -f

# Остановка
docker compose down

# Применить схему БД
docker compose run --rm web npx prisma db push

# Заполнить данными
docker compose run --rm web npx prisma db seed

# Подключиться к PostgreSQL
docker compose exec postgres psql -U medical_user -d medical_clinic

# Проверить модели Ollama
docker compose exec ollama ollama list

# Очистка Docker
docker system prune -a
```

---

## 📊 Мониторинг Docker в Windows

### Docker Desktop Dashboard

Docker Desktop имеет встроенный UI для мониторинга:
- Откройте Docker Desktop
- Вкладка **"Containers"** - список запущенных контейнеров
- Кликните на контейнер → увидите логи, статистику, можете зайти в shell

### Альтернативные инструменты

1. **Portainer** (Web UI для Docker):

```powershell
docker run -d -p 9000:9000 --name portainer ^
  -v /var/run/docker.sock:/var/run/docker.sock ^
  portainer/portainer-ce
```

Откройте: http://localhost:9000

2. **LazyDocker** (TUI в терминале):

```powershell
# Установка через Scoop
scoop install lazydocker

# Запуск
lazydocker
```

---

## 🎯 Следующие шаги

1. ✅ Убедитесь что все сервисы запустились: `docker compose ps`
2. ✅ Откройте http://localhost:3000
3. ✅ Проверьте голосовой интерфейс (Chrome/Edge)
4. ✅ Зайдите в админ-панель: http://localhost:3000/admin
5. ✅ Изучите Prisma Studio: `npm run prisma:studio`

---

## 📚 Дополнительные ресурсы

- **Docker Desktop документация:** https://docs.docker.com/desktop/windows/
- **Docker Compose документация:** https://docs.docker.com/compose/
- **WSL 2 документация:** https://learn.microsoft.com/windows/wsl/
- **Основная документация проекта:** [README.md](README.md)
- **Быстрый старт:** [QUICKSTART.md](QUICKSTART.md)

---

**Возникли проблемы?** Создайте [Issue](https://github.com/Saaayurii/MedicalBrothers/issues) с описанием ошибки и вывода команд! 🎯
