# my-university
Вся жизнь вашего университета в одном месте

## Архитектурный подход тенантов
### Процесс получения пользователем списка университетов, в которые он добавлен и дальнейшее взаимодействие с ними
<img width="671" height="727" alt="Без названия 15 ноября 2025 03_47-2" src="https://github.com/user-attachments/assets/06769a38-8680-498a-93f3-9b769a1649ed" />



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

### Performance Documentation

- `docs/perf/student-projects.md` - Student projects performance optimizations and monitoring
- `perf/README.md` - Load testing guide

### Slow Query Logging

In development mode, EF Core automatically logs queries taking longer than 200ms. Check application logs for warnings about slow database queries.
