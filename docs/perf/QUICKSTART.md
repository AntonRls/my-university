# Quick Start: Performance Optimizations

## Applying Database Migrations

The performance optimizations include database indexes. Apply them with:

```bash
cd my-university/HacatonMax.WebHost
dotnet ef database update --project ../HacatonMax.University.StudentsProject
```

Or simply run the application - migrations are applied automatically on startup.

## Verifying Optimizations

### 1. Check Split Queries

After starting the application, check logs for multiple SELECT statements instead of one large JOIN:

```
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (4ms) [Parameters=[...], CommandType='Text', CommandTimeout='30']
      SELECT s.id, s.creator_id, s.description, s.event_id, s.title
      FROM "students-projects".student_projects AS s
      WHERE s.id = @__id_0
      LIMIT 1

info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (2ms) [Parameters=[...], CommandType='Text', CommandTimeout='30']
      SELECT s0."SkillId", s0."StudentProjectId", s1.id, s1.name
      FROM "students-projects".skill_student_projects AS s0
      ...
```

You should see multiple queries instead of one massive JOIN.

### 2. Verify Indexes

Connect to PostgreSQL and check indexes:

```sql
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'students-projects'
ORDER BY tablename, indexname;
```

You should see:
- `IX_student_projects_event_id` on `student_projects`
- `IX_student_project_participants_student_project_id_created_at` on `student_project_participants`

### 3. Seed Data (optional, для нагрузочных тестов)

```bash
dotnet run --project HacatonMax.WebHost -- \
  --seed-student-projects \
  --seed-projects=5000 \
  --seed-max-participants=25 \
  --seed-force
```

### 4. Test Performance (легкий сценарий)

Run a simple load test:

```bash
# Start the application first
cd my-university/HacatonMax.WebHost
dotnet run

# In another terminal, run k6
k6 run perf/load-tests/student-projects.js
```

### 5. Full Suite до 200 VU

```bash
BASE_URL=http://localhost:5099 \
AUTH_TOKEN="Bearer eyJhbGciOi..." \
k6 run perf/load-tests/student-projects-full.js
```

`AUTH_TOKEN` — токен реального пользователя (см. `/auth`). Перед запуском убедись, что сидер создал достаточно данных.

## Expected Results

- Query time should drop from ~30s to <5s
- Multiple smaller queries instead of one large JOIN
- Better RPS capacity (50-100+ requests/second)

## Troubleshooting

### Migrations Not Applied

If indexes are missing, manually apply:

```bash
dotnet ef migrations add AddStudentProjectIndexes \
  --project HacatonMax.University.StudentsProject \
  --context StudentProjectsDbContext
```

### Still Seeing Slow Queries

1. Check if split queries are enabled (look for `AsSplitQuery()` in repository)
2. Verify indexes exist in database
3. Check application logs for slow query warnings (>200ms)

### Metrics Not Working

Ensure the metrics middleware is registered in `Program.cs`:
```csharp
builder.Services.AddRequestMetrics();
app.UseRequestMetrics();
```

