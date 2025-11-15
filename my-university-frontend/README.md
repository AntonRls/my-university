# My University Frontend

Frontend приложение для системы управления университетом.

## Автоматическая передача токена авторизации

Приложение поддерживает автоматическую передачу токена авторизации на все API-запросы через переменные окружения. Это полезно для:

- Разработки и отладки
- Автоматизированного тестирования
- CI/CD пайплайнов
- Docker окружений

### Как это работает

Токен авторизации проверяется в следующем порядке приоритета:

1. **Auth state** - токен из состояния после успешного логина
2. **Cookie** - токен сохраненный в cookies
3. **Environment variable** - `VITE_DEFAULT_AUTH_TOKEN` из переменных окружения

Если токен найден на любом из этих уровней, он автоматически добавляется в заголовок `Authorization: Bearer <token>` для всех API-запросов.

### Использование с Docker Compose

Добавьте токен в `.env` файл или передайте через командную строку:

```bash
# Создайте .env файл (можно скопировать из env.example)
cp env.example .env

# Добавьте токен в .env
echo "VITE_DEFAULT_AUTH_TOKEN=your_jwt_token_here" >> .env

# Запустите контейнер
docker-compose up -d
```

Или передайте напрямую при запуске:

```bash
VITE_DEFAULT_AUTH_TOKEN=your_jwt_token docker-compose up -d
```

### Использование в разработке

Для локальной разработки создайте `.env.local` файл в корне проекта:

```env
VITE_DEFAULT_AUTH_TOKEN=your_jwt_token_here
```

Токен будет автоматически подхвачен при запуске `pnpm dev`.

### Получение токена

Чтобы получить токен для использования:

1. Авторизуйтесь в приложении через браузер
2. Откройте DevTools (F12) → Application → Cookies
3. Найдите cookie `auth.access_token`
4. Скопируйте значение и используйте его

Или используйте API для получения токена:

```bash
curl -X POST http://localhost:5050/auth \
  -H "Content-Type: application/json" \
  -d '{"query_params": "your_query_params_here"}'
```

### Конфигурация в compose.yaml

```yaml
services:
  frontend:
    build:
      args:
        VITE_DEFAULT_AUTH_TOKEN: ${VITE_DEFAULT_AUTH_TOKEN:-}
    environment:
      DEFAULT_AUTH_TOKEN: ${DEFAULT_AUTH_TOKEN:-}
```

### Безопасность

⚠️ **ВАЖНО**: Не коммитьте токены в репозиторий!

- Файлы `.env` и `.env.local` автоматически игнорируются git
- Используйте эту функцию только в dev/test окружениях
- Для production используйте стандартный flow авторизации через UI

### API URLs Configuration

Приложение также поддерживает настройку базовых URL для различных API:

```env
VITE_TENANT_API_BASE_URL=http://localhost:5099
VITE_AUTH_API_BASE_URL=http://localhost:5050
VITE_ADMIN_API_BASE_URL=http://localhost:5001
VITE_API_BASE_URL=http://localhost:5099
```

## Разработка

```bash
# Установка зависимостей
pnpm install

# Запуск dev сервера
pnpm dev

# Сборка для production
pnpm build

# Запуск production билда локально
pnpm preview
```

## Docker

```bash
# Сборка образа
docker-compose build

# Запуск контейнера
docker-compose up -d

# Логи
docker-compose logs -f frontend

# Остановка
docker-compose down
```

## Структура проекта

```
my-university-frontend/
├── apps/
│   └── my-university/          # Основное приложение
├── libs/
│   ├── api/                    # API клиент и сервисы
│   └── shared-ui/              # Переиспользуемые UI компоненты
├── compose.yaml                # Docker Compose конфигурация
├── Dockerfile                  # Multi-stage Docker образ
└── env.example                 # Пример переменных окружения
```

## Troubleshooting

### Токен не работает

1. Проверьте, что токен валидный (не истек срок действия)
2. Убедитесь, что переменная `VITE_DEFAULT_AUTH_TOKEN` правильно установлена
3. Пересоберите Docker образ после изменения переменных окружения
4. Проверьте логи контейнера: `docker-compose logs frontend`

### CORS ошибки

Убедитесь, что backend API настроен на принятие запросов с вашего frontend origin.

