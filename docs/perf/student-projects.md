# Student Projects Performance Optimization

## Overview

This document describes the performance optimizations applied to the student projects module, how to seed massive datasets, and how to measure the impact (до 200 RPS).

## Optimizations Applied

### 1. Query Splitting
- **Problem**: Single massive JOIN caused cartesian products and 30+ s latency.
- **Solution**: `QuerySplittingBehavior.SplitQuery` + `AsSplitQuery()` on repository includes.
- **Impact**: Multiple short SELECTs, <5 s latency, лучшее использование connection pool.

### 2. Database Indexes
- `student_projects(event_id)`
- `student_project_participants(student_project_id, created_at)`

### 3. Repository Cleanup
- `AsNoTrackingWithIdentityResolution()` + сортировка участников на уровне SQL.
- Уменьшение выделений/дубликатов.

### 4. Slow Query Logging & Metrics
- В dev включены detailed errors, sensitive logging off, `LogTo` >200 ms.
- Middleware регистрирует `http_requests_total` и `http_request_duration_seconds` в `/metrics`.

## Data Seeding for Load Tests

Используй встроенный сидер (Bogus) для генерации десятков тысяч сущностей:

```bash
dotnet run --project HacatonMax.WebHost -- \
  --seed-student-projects \
  --seed-projects=5000 \
  --seed-max-participants=25 \
  --seed-skill-pool=80 \
  --seed-role-pool=30 \
  --seed-force
```

Параметры можно менять (см. `StudentProjectsSeedOptions`). `--seed-force` очищает таблицы (`students-projects` schema) перед заполнением.

## Load Testing

### Лёгкий сценарий (GET)
```bash
k6 run perf/load-tests/student-projects.js
```
Stages: 10 → 50 → 100 VU, цели p95 < 2s.

### Полный сценарий (все ручки, до 200 VU)
```bash
BASE_URL=http://localhost:5099 \
AUTH_TOKEN="Bearer eyJhbGciOi..." \
k6 run perf/load-tests/student-projects-full.js
```
Сценарий выполняет:
- `GET` на проекты/скиллы/роли
- `POST/PUT /student-projects`
- `POST` заявок, `approve`, `reject`, `roles`, `delete participant`
- `POST /student-projects/team-roles`

Stages: 25 → 100 → 200 VU (≈200 RPS). Требуется валидный токен.

### Результаты
- k6 summary в консоли
- подробные метрики в `perf/load-tests/results.json`
- мониторинг `/metrics` во время теста

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| GET /student-projects (p95) | <2s | TBD |
| Full suite (p95) | <3s | TBD |
| RPS capacity | 200 VU без деградации | TBD |
| Database query time | <200 ms | TBD |
| Error rate | <2% | TBD |

*Значения “Current” обновляются после каждого прогона.*

## Monitoring
- **Application logs** — ищи `CommandExecuted` >200 ms
- **Database** — CPU, I/O, connection pool
- **/metrics** — `http_requests_total`, `http_request_duration_seconds`

## Troubleshooting
1. Проверь миграции и индексы.
2. Удостоверься, что сидер прогнан (без данных ручки почти не нагружаются).
3. 401/403 → проверь `AUTH_TOKEN`.
4. Высокий error rate → смотри логи сервиса и БД (возможен перегрев connection pool).

## Next Steps
1. Регулярно прогоняй `student-projects-full.js` после релизов.
2. Сохраняй отчёты k6/Grafana для сравнения трендов.
3. При необходимости рассматривай кэширование и pagination для публичных выдач.
