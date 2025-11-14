# Performance Testing

This directory contains load testing scripts, seeding utilities, and documentation for the student-projects service.

## Prerequisites
- k6 CLI: `brew install k6` (macOS) or follow [official guide](https://k6.io/docs/getting-started/installation/)
- Docker (optional) for running k6 inside a container
- Access token for protected endpoints (`AUTH_TOKEN`)

## Database Seeding

Before нагрузочное тестирование запусти сидер, чтобы наполнить БД тысячами проектов/участников:

```bash
dotnet run --project HacatonMax.WebHost -- \
  --seed-student-projects \
  --seed-projects=5000 \
  --seed-max-participants=25 \
  --seed-skill-pool=80 \
  --seed-role-pool=30 \
  --seed-force
```

Флаги можно комбинировать:
- `--seed-student-projects` — включает сидер
- `--seed-projects=<n>` — сколько проектов создать (по умолчанию 1000)
- `--seed-max-participants=<n>` — верхняя граница участников на проект (по умолчанию 18)
- `--seed-skill-pool=<n>` / `--seed-role-pool=<n>` — размеры справочников
- `--seed-force` — очищает таблицы перед заполнением

## Load Test Scenarios

### 1. Лёгкий сценарий (только GET)

```bash
k6 run perf/load-tests/student-projects.js
```

Переменные окружения:

```bash
BASE_URL=http://localhost:5099 \
EVENT_ID=123 \
SKILL_IDS=uuid1,uuid2 \
k6 run perf/load-tests/student-projects.js
```

Stages: 10 → 50 → 100 VU. Target: p95 < 2s, error rate < 1%.

### 2. Полный сценарий (все ручки, до 200 VU)

```bash
BASE_URL=http://localhost:5099 \
AUTH_TOKEN="Bearer eyJhbGciOi..." \
k6 run perf/load-tests/student-projects-full.js
```

Что покрывает `student-projects-full.js`:
- `GET /student-projects`, `/skills`, `/team-roles`
- `POST/PUT /student-projects`
- `POST` заявок, `approve`, `reject`, `update roles`, `delete participant`
- `POST /student-projects/team-roles`

Stages: 25 → 100 → 200 VU (≈200 RPS). Thresholds: p95 < 3s, error rate < 2%.

> **Если k6 не установлен** — используй Docker: `docker run --rm -v "$PWD":/scripts -w /scripts grafana/k6:latest run perf/load-tests/student-projects-full.js ...`

## Understanding Results

После прогона смотри:
1. Console output — live метрики и финальный summary
2. `perf/load-tests/results.json` — сохранённые показатели

Ключевые метрики:
- `http_reqs` — количество запросов
- `http_req_duration` — среднее/percentile время
- `http_req_failed` / `errors_*` — процент ошибок
- `vus` — количество виртуальных пользователей

## Performance Targets

- `GET /student-projects`: >=100 RPS с p95 < 2s
- Полный сценарий: 200 VU без роста error rate >2%
- SQL-запросы: <200 ms, иначе появляется warning в логах

## Monitoring During Tests
1. Application logs — ищи `CommandExecuted` >200 ms
2. `/metrics` endpoint — отслеживай `http_requests_total` и `http_request_duration_seconds`
3. DB ресурсы — CPU, I/O, количество соединений

## Troubleshooting
- Проверь, что миграции и индексы применены
- Убедись, что сидер запущен (без данных ручки почти не нагружаются)
- 401/403 → невалидный `AUTH_TOKEN`
- Высокий error rate → посмотри логи сервиса и БД, возможно, достигнут лимит соединений
