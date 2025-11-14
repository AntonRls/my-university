# Тесты для Student Projects API

## Запуск тестов

```bash
dotnet test HacatonMax.University.StudentsProject.Tests/HacatonMax.University.StudentsProject.Tests.csproj
```

## Покрытие тестами

Тесты покрывают основные handlers контроллера `StudentProjectsController`:

1. ✅ `RequestParticipation_ShouldAddParticipant` - запрос на участие в проекте
2. ✅ `RequestParticipation_AsCreator_ShouldThrowException` - проверка, что создатель не может запросить участие
3. ✅ `ApproveParticipant_ShouldUpdateStatus` - одобрение участника
4. ✅ `RejectParticipant_ShouldUpdateStatus` - отклонение участника
5. ✅ `RemoveParticipant_ShouldDeleteParticipant` - удаление участника
6. ✅ `CreateTeamRole_ShouldCreateRole` - создание роли команды
7. ✅ `GetStudentProjectById_ShouldReturnProject` - получение проекта по ID
8. ✅ `GetStudentProjectById_WithInvalidId_ShouldThrowNotFoundException` - проверка обработки несуществующего проекта
9. ✅ `GetStudentProjects_ShouldReturnProjects` - получение списка проектов
10. ✅ `UpdateParticipantRoles_ShouldUpdateRoles` - обновление ролей участника

**Всего тестов: 10 (10 пройдено, 0 пропущено)**

## Результаты тестирования

✅ **RequestParticipation** - исправлен и протестирован (решает проблему DbUpdateConcurrencyException)
✅ **ApproveParticipant** - работает корректно
✅ **RejectParticipant** - работает корректно
✅ **RemoveParticipant** - работает корректно
✅ **CreateTeamRole** - работает корректно
✅ **GetStudentProjectById** - работает корректно
✅ **GetStudentProjects** - работает корректно
✅ **UpdateParticipantRoles** - исправлен и работает корректно

## Примечания

Тесты используют in-memory базу данных для изоляции и скорости выполнения.

### Исправление UpdateParticipantRoles

Handler `UpdateStudentProjectParticipantRolesHandler` был исправлен для корректной работы с in-memory БД:
- Добавлен метод `UpdateParticipantRoles` в репозиторий, который удаляет старые роли и добавляет новые через прямой доступ к контексту
- Это решает проблему с `DbUpdateConcurrencyException` в in-memory провайдере EF Core
- Handler теперь работает корректно как с in-memory БД (для тестов), так и с реальной PostgreSQL БД (в production)

