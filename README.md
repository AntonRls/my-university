# my-university
Вся жизнь вашего университета в одном месте

## Запуск
Для запуска достаточно просто ввести такую команду:
```
docker compose up --build
```
или 
```
docker compose -f compose.yaml up --build
```

## Ручное тестирование
После запуска у вас поднимется 3-backend сервиса: AuthService, Admin и Tenant со всеми сервисами для студента (расписание, подбор проектов, календарь мероприятий университета, библиотека, дедлайны студента).<br>Сваггеры будут находиться на таких URL:<br>
<ul>
<li>http://localhost:5099/swagger - Tenant со сервисами для студента</li>
<li>http://localhost:5001/swagger - Панель админа для управления вузом</li>
<li>http://localhost:5050/swagger - AuthService</li>
</ul>

Для всех сервисов мы подготовили единый AccessToken, его вы можете вставить нажав на кнопку Authorize в сваггере. Он нужен, чтобы сервисы понимали что вы авторизированы, иначе будет 401 ошибка:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6Ijk3Njc4OTc3IiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZSI6IiIsImZpcnN0TmFtZSI6ItCh0LXRgNCz0LXQuSIsImxhc3ROYW1lIjoi0KfQtdGA0L3Ri9GI0ZHQsiIsImV4cCI6MTc2NTc3MDk0NywiaXNzIjoiTXlVbml2ZXJzaXR5IiwiYXVkIjoiTXlVbml2ZXJzaXR5VXNlcnMifQ.ul7fYPPsZctsVp5XLZrb04fJy32WVzDXMvVLHuHKzNY
```

## Автоматическое тестирование
У нас так-же подготовлены автоматически тесты, их вы можете запустить прописав такую команду из корня проекта:
```
dotnet test
```

## Архитектурный подход тенантов
### Детальный пример работы с тенантами
К дефолтному URL сервиса в тенанте добавляется <tenant_name>, например

было: <b>GET university-events</b> <br>
стало: <b>GET <tenant_name>/university-events</b>

Сам <tenant_name> возвращается в endpoint'e админки университетов:<br>
```
GET users/me
Bearer <access_token>
```

response: - список университетов пользователя
```json
[
  {
    "user_id": 1,
    "university_tenant_name": "cu",
    "approve_status": "Approved"
  },
  {
    "user_id": 1,
    "university_tenant_name": "hse",
    "approve_status": "Approved"
  }
]
```

### Процесс получения пользователем списка университетов, в которые он добавлен и дальнейшее взаимодействие с ними
<img width="671" height="727" alt="Без названия 15 ноября 2025 03_47-2" src="https://github.com/user-attachments/assets/06769a38-8680-498a-93f3-9b769a1649ed" />

## Schedule service
- Все слоты (пары, личные активности, события) лежат в схеме `schedule` (таблицы `entries`, `attendees`) и управляются через `HacatonMax.University.Schedule`.
- Прокатить миграции:
  ```bash
  dotnet ef database update Init_Schedule \
    --project HacatonMax.University.Schedule/HacatonMax.University.Schedule.csproj \
    --startup-project HacatonMax.WebHost/HacatonMax.WebHost.csproj \
    --context ScheduleDbContext
  ```
- Основные ручки:
  - `GET /schedule/groups/{groupId}` — получить пары группы (фильтры `from`, `to`, `deliveryType`).
  - `POST|PUT|DELETE /schedule/groups/{groupId}/lessons` — CRUD для админов.
  - `GET /schedule/me` — объединённое расписание студента (группы + личные + события).
  - `POST|PUT|DELETE /schedule/me/slots` — управление личными активностями.
- Сервис событий теперь синхронизирует регистрации с расписанием через `IScheduleIntegrationService`.

## Performance Monitoring

### Metrics Endpoint

The application exposes performance metrics at `/metrics`. This endpoint provides information about:
- HTTP request rates (RPS)
- Request duration histograms
- Available metrics for monitoring

### Load Testing & Seeding

1. **Заполни БД** (опционально, для тяжёлых тестов):
   ```bash
   dotnet run --project HacatonMax.WebHost -- --seed-student-projects --seed-projects=5000 --seed-force
   ```

2. **k6 сценарии**:
   ```bash
   # Install k6 (if not already installed)
   brew install k6

   # Лёгкий сценарий (GET)
   k6 run perf/load-tests/student-projects.js

   # Полный сценарий (все ручки, до 200 VU)
   BASE_URL=http://localhost:5099 \
   AUTH_TOKEN="Bearer eyJhbGciOi..." \
   k6 run perf/load-tests/student-projects-full.js
   ```

Подробные инструкции: `perf/README.md`.

### Документация по производительности

- `docs/perf/student-projects.md` - Оптимизация и мониторинг производительности студенческих проектов
- `perf/README.md` - Руководство по нагрузочному тестированию

### Slow Query Logging

В режиме разработки EF Core автоматически регистрирует запросы, занимающие более 200 мс. Проверьте журналы приложения на наличие предупреждений о медленных запросах к базе данных.

## Requirements 
<a href="https://github.com/AntonRls/my-university/blob/main/requirements_back.txt">Requirements для бэка</a>
