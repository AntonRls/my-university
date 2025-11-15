# Academic Structure Architecture

This note describes how to model and store the university → faculty → program → course → group → student hierarchy (including custom groups) in the existing .NET + PostgreSQL stack. It covers the storage choice, tenant handling, schema, backend module outline, group semantics, and integration touchpoints for schedules and deadlines.

## 1. Persistence Strategy

| Option | Pros | Cons | Fit |
| --- | --- | --- | --- |
| Relational DB (PostgreSQL) | ACID guarantees, FK enforcement for deep hierarchy, mature tooling (EF Core, migrations, analytics via SQL), easy cross-entity reporting, native JSON for metadata bullets | Requires forethought for hierarchical queries (CTEs, indexes), schema migrations for structural change | ✅ Already in place (`AdminDbContext`, `UsersDbContext`) with ops tooling and observability; easiest to reuse |
| Document DB (e.g., MongoDB) | Flexible schema evolution, single document can hold nested hierarchy, horizontal scaling via sharding | Harder to enforce constraints (unique student per primary group), complex multi-document transactions, new ops surface (backup, monitoring), no EF Core-first support | ⚠️ Adds another persistence layer with little payoff; cross-entity queries become ad-hoc |

**Decision:** Keep PostgreSQL as the source of truth. The hierarchy is highly relational (FK chains, uniqueness constraints, reporting on membership), so relational storage plus EF Core fits best. JSON/JSONB columns can host optional metadata (e.g., schedule preferences) without schema explosion.

## 2. Tenant Strategy

### Current state

- `HacatonMax.Admin` stores universities in `admin.universities` with `tenant_name`.
- `HacatonMax.University.Users` links people to tenants through the `users.user_universities` join table.
- Each functional module has its own schema (e.g., `university-library`, `users`) inside the same physical PostgreSQL instance; connection string is shared but schemas differ.

### Target model

1. **Tenant metadata authority** – keep the admin DB as the registry (ID, name, tenant slug, plan, feature flags).
2. **Shared-DB multi-tenancy now** – structure tables live in a shared schema (e.g., `structure.*`) with every row carrying `tenant_id`. Composite PKs or filtered indexes enforce tenant scoping.
3. **TenantContext middleware** – add a `TenantContext` service resolved per request:
   - Extract tenant from JWT claims, query string, or host (`{tenant}.university.local`).
   - Validate membership via `UsersDbContext`.
   - Inject into EF Core through `ITenantProvider`, so repositories always filter on `tenant_id`.
4. **Future isolation path** – the schema keeps tenant-aware PKs so data can be migrated to a dedicated DB/server when scaling (one code path; change connection string per tenant).
5. **Caching / read replicas** – group hierarchies can be cached per tenant in Redis using `tenant:{id}:structure:*` keys without cross-tenant leakage.

## 3. Data Model

All tables reside in schema `structure`. Every table includes `tenant_id`, `created_at`, `updated_at`, and optional `deleted_at` for soft deletes.

### Core tables

| Table | Key fields | Constraints / Notes |
| --- | --- | --- |
| `faculties` | `id` (PK, bigint), `tenant_id`, `name`, `code` | Unique (`tenant_id`, `code`); cascade delete removes programs |
| `programs` | `id`, `tenant_id`, `faculty_id`, `name`, `degree_level` (`bachelor`, `master`, etc.) | FK (`tenant_id`, `faculty_id`); unique (`tenant_id`, `faculty_id`, `name`) |
| `program_courses` | `id`, `tenant_id`, `program_id`, `course_number` (1–6), `title`, `ects` | Unique (`tenant_id`, `program_id`, `course_number`, `title`); supports electives |
| `groups` | `id`, `tenant_id`, `program_course_id`, `type` (`main`, `custom_admin`, `custom_user`), `label`, `capacity`, `is_primary_allowed` | Unique (`tenant_id`, `program_course_id`, `label`); FK to `custom_group_meta` when custom |
| `custom_group_meta` | `group_id`, `created_by_user_id`, `created_by_role` (`student`, `teacher`, `admin`), `visibility` (`private`, `tenant`), `moderation_status` | Optional row per custom group; enforce FK to `groups.id` |
| `group_members` | `group_id`, `student_id`, `tenant_id`, `membership_type` (`primary`, `auxiliary`), `joined_at` | Composite PK (`group_id`, `student_id`); unique partial index ensuring a student has ≤1 `membership_type = 'primary'` per tenant |

### Additional indexes & constraints

- `program_courses` index on (`tenant_id`, `program_id`, `course_number`) to power “all groups of 3rd course”.
- `groups` check constraint keeps `type = 'main'` ⇒ `is_primary_allowed = true`.
- `group_members` check: `membership_type = 'primary'` ⇒ group `is_primary_allowed`.
- `custom_group_meta` ensures only `custom_*` group types exist.
- All tables carry `row_version` (concurrency token) for optimistic locking.

### Enforcement of “student can be in at most one primary group per university”

```sql
create unique index ux_group_members_primary
    on structure.group_members (tenant_id, student_id)
    where membership_type = 'primary';
```

Auxiliary/custom memberships bypass this index because they are stored with `membership_type = 'auxiliary'`.

## 4. Backend Module Outline (`HacatonMax.University.Structure`)

```
HacatonMax.University.Structure/
  Application/
    Commands/
      CreateFacultyCommand.cs
      UpsertGroupCommand.cs
    Queries/
      GetStructureTreeQuery.cs
      GetGroupsByCourseQuery.cs
  Controllers/
    FacultiesController.cs
    ProgramsController.cs
    GroupsController.cs
  Domain/
    Faculty.cs
    Program.cs
    ProgramCourse.cs
    Group.cs
    GroupMember.cs
    GroupType.cs
  Infrastructure/
    StructureDbContext.cs
    Configurations/*.cs
    StructureRepository.cs
    TenantContextAccessor.cs
```

- `StructureDbContext` targets schema `structure` and registers via `AddUniversityStructureModule`.
- Dependency extension wires `StructureDbContext`, repositories, `TenantContextAccessor`, and Mediator handlers.
- `HacatonMax.WebHost/Program.cs` calls `.AddUniversityStructureModule(builder.Configuration)` next to other modules and adds migrations to the startup migration block.
- Controllers expose CRUD endpoints plus hierarchy fetchers (e.g., `GET /structure/tenants/{tenantId}/tree`, `POST /structure/groups/{groupId}/members`).
- Repositories always filter by `tenant_id` from `ITenantContext`.

## 5. Custom Group Semantics

- **Types**
  - `main`: canonical academic groups owned by admins; students must belong to exactly one primary main group per tenant.
  - `custom_admin`: ad-hoc cohorts created by admins or faculty staff (e.g., honors groups) that may allow primary or auxiliary membership based on configuration.
  - `custom_user`: peer groups initiated by students or teachers (study clubs, project squads). Always auxiliary; cannot satisfy the “primary group” constraint.
- **Metadata**
  - `custom_group_meta.created_by_user_id` references `users.users`.
  - `created_by_role` distinguishes admin-created vs student/teacher; useful for moderation.
  - `moderation_status` (`pending`, `approved`, `blocked`) enforces review before the group becomes visible tenant-wide.
  - `visibility`: `private` (invite-only), `tenant` (searchable by everyone in tenant).
- **Membership policies**
  - Primary memberships allowed only when `groups.is_primary_allowed = true` (usually main/admin groups).
  - Auxiliary memberships unlimited but can have `capacity` to avoid oversized chats.
  - Custom groups can request admin approval; statuses stored in meta table and exposed via notification events.

## 6. Integration Touchpoints

1. **Schedule service** – lessons attach to `group_id`. Existing schedule APIs can query `StructureDbContext` via REST to validate group existence and fetch course/faculty context. Read models can be cached per tenant.
2. **Deadlines / assignments** – tasks reference `group_id` (primary or custom). When posting, the service ensures the group is either main or approved custom. Batch queries (group → members) rely on `group_members`.
3. **Events / Bot** – notifications leverage the hierarchy to broadcast to all members of a course, faculty, or custom cohort by traversing `(faculty → program → program_course → groups → group_members)`.
4. **Frontend DTOs** – `my-university-frontend/apps/my-university/src/entities` gains shared types:
   - `FacultyTree` (faculty + programs + courses + groups).
   - `GroupDetails` (metadata + members + custom meta).
   - `GroupMembership` (primary vs auxiliary flags) to drive UI constraints (e.g., disable “Join primary group” button when already assigned).
5. **Caching & search** – Graph-like browsing can be backed by Elastic caches (optional) but PostgreSQL remains source of truth; future read models (Materialized Views) can pre-compose frequently requested slices (e.g., `structure.group_summary`).

With this architecture the platform can confidently model institutional hierarchies, enforce membership rules, and power downstream schedule/deadline features without switching stacks or compromising tenant isolation.

## Schedule service

The same PostgreSQL instance hosts the schedule schema to keep joins trivial for analytics and notifications.

- `schedule.entries` — описывает слот расписания. Колонки:
  - `tenant_id`, `group_id`, `owner_user_id`
  - `source_type` (`admin_lesson`, `manual_personal`, `university_event`) и `source_entity_id`
  - `delivery_type` (`offline` или `online`), `physical_location`, `online_link`
  - временное окно `starts_at`/`ends_at`
- `schedule.attendees` — связь `entry ↔ user` для персональных подписок (например, события). Enforced unique (`entry_id`, `user_id`).
- Индексы:
  - `tenant_id + starts_at` — быстрые выборки по дню/неделе
  - `tenant_id + group_id + starts_at` — списки пар для группы
  - `owner_user_id + starts_at` — персональные активности
  - уникальность по (`tenant_id`, `source_type`, `source_entity_id`) для событий.

### Модуль

- `HacatonMax.University.Schedule` подключается через `AddUniversityScheduleModule`.
- Контроллеры:
  - `GroupScheduleController` — CRUD админских уроков (`/schedule/groups/{groupId}`).
  - `MyScheduleController` — персональные запросы студентом (`/schedule/me`).
- Интеграция с событиями:
  - `IScheduleIntegrationService` (контракт в `HacatonMax.Common`) принимает payload события (название, формат, время) и создаёт/обновляет слот + привязывает пользователя.
  - При отмене регистрации вызывается `RemoveEventSubscriptionAsync`, что удаляет участника и при необходимости слот.
- Для выборки «моё расписание» агрегируются:
  1. Все группы пользователя (`structure.group_members`).
  2. Слоты, где пользователь владелец (`owner_user_id`).
  3. События, где есть `attendee`.

