# Тесты для University Events API

## Запуск тестов

```bash
dotnet test HacatonMax.University.Events.Tests/HacatonMax.University.Events.Tests.csproj
```

## Покрытие тестами

Тесты покрывают все handlers контроллера `UniversityEventsController`:

### 1. CreateUniversityEvent (Создание события)
- ✅ `CreateUniversityEvent_ShouldCreateEvent` - успешное создание события
- ✅ `CreateUniversityEvent_WithExistingTags_ShouldReuseTags` - переиспользование существующих тегов
- ✅ `CreateUniversityEvent_WithoutParticipantsLimit_ShouldCreateEvent` - создание события без лимита участников

### 2. GetUniversityEventById (Получение события по ID)
- ✅ `GetUniversityEventById_ShouldReturnEvent` - успешное получение события
- ✅ `GetUniversityEventById_WithInvalidId_ShouldThrowNotFoundException` - обработка несуществующего события
- ✅ `GetUniversityEventById_WithRegisteredUser_ShouldShowRegistrationStatus` - отображение статуса регистрации

### 3. GetUniversityEvents (Получение списка событий)
- ✅ `GetUniversityEvents_ShouldReturnAllEvents` - получение всех событий
- ✅ `GetUniversityEvents_WithTagFilter_ShouldReturnFilteredEvents` - фильтрация по тегам
- ✅ `GetUniversityEvents_WithMultipleTags_ShouldReturnEventsWithAnyTag` - фильтрация по нескольким тегам

### 4. UpdateUniversityEvent (Обновление события)
- ✅ `UpdateUniversityEvent_ShouldUpdateEvent` - успешное обновление события
- ✅ `UpdateUniversityEvent_WithInvalidId_ShouldThrowNotFoundException` - обработка несуществующего события
- ✅ `UpdateUniversityEvent_WithExistingTags_ShouldReuseTags` - переиспользование существующих тегов

### 5. DeleteUniversityEvent (Удаление события)
- ✅ `DeleteUniversityEvent_ShouldDeleteEvent` - успешное удаление события
- ✅ `DeleteUniversityEvent_WithInvalidId_ShouldThrowNotFoundException` - обработка несуществующего события
- ✅ `DeleteUniversityEvent_WithRegistrations_ShouldDeleteRegistrations` - удаление события с регистрациями

### 6. GetUniversityEventTags (Получение тегов)
- ✅ `GetUniversityEventTags_ShouldReturnAllTags` - получение всех тегов
- ✅ `GetUniversityEventTags_WithNoTags_ShouldReturnEmptyList` - получение пустого списка тегов

### 7. SearchUniversityEvents (Поиск событий)
- ✅ `SearchUniversityEvents_ShouldReturnMatchingEvents` - поиск по названию
- ✅ `SearchUniversityEvents_ShouldSearchInDescription` - поиск по описанию
- ✅ `SearchUniversityEvents_WithEmptyQuery_ShouldThrowBadRequestException` - обработка пустого запроса
- ✅ `SearchUniversityEvents_WithNullQuery_ShouldThrowBadRequestException` - обработка null запроса
- ✅ `SearchUniversityEvents_ShouldBeCaseInsensitive` - регистронезависимый поиск

### 8. RegisterForUniversityEvent (Регистрация на событие)
- ✅ `RegisterForUniversityEvent_ShouldRegisterUser` - успешная регистрация
- ✅ `RegisterForUniversityEvent_WithInvalidId_ShouldThrowNotFoundException` - обработка несуществующего события
- ✅ `RegisterForUniversityEvent_WhenAlreadyRegistered_ShouldThrowBadRequestException` - повторная регистрация
- ✅ `RegisterForUniversityEvent_WhenLimitReached_ShouldThrowBadRequestException` - достижение лимита участников
- ✅ `RegisterForUniversityEvent_WithoutLimit_ShouldAllowRegistration` - регистрация без лимита

### 9. UnregisterFromUniversityEvent (Отмена регистрации)
- ✅ `UnregisterFromUniversityEvent_ShouldUnregisterUser` - успешная отмена регистрации
- ✅ `UnregisterFromUniversityEvent_WithInvalidId_ShouldThrowNotFoundException` - обработка несуществующего события
- ✅ `UnregisterFromUniversityEvent_WhenNotRegistered_ShouldThrowBadRequestException` - отмена несуществующей регистрации
- ✅ `UnregisterFromUniversityEvent_WithMultipleRegistrations_ShouldOnlyUnregisterCurrentUser` - отмена регистрации при множественных регистрациях

**Всего тестов: 30+**

## Структура тестов

Тесты используют:
- **In-Memory Database** для изоляции тестов
- **FluentAssertions** для читаемых проверок
- **Test helpers** для мокирования зависимостей:
  - `TestUserContextService` - мок сервиса пользователя
  - `TestReminderScheduler` - мок планировщика напоминаний
  - `TestUniversityEventsRepository` - тестовая реализация репозитория

## Покрытие сценариев

### Успешные сценарии
- ✅ Создание, чтение, обновление, удаление событий
- ✅ Работа с тегами (создание, переиспользование)
- ✅ Регистрация и отмена регистрации
- ✅ Поиск и фильтрация событий

### Обработка ошибок
- ✅ NotFoundException для несуществующих ресурсов
- ✅ BadRequestException для некорректных запросов
- ✅ Валидация лимитов участников
- ✅ Проверка дублирования регистраций

### Граничные случаи
- ✅ События без лимита участников
- ✅ Пустые списки и коллекции
- ✅ Регистронезависимый поиск
- ✅ Фильтрация по множественным тегам

