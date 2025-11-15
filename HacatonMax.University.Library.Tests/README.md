# Тесты для University Library API

## Запуск тестов

```bash
dotnet test HacatonMax.University.Library.Tests/HacatonMax.University.Library.Tests.csproj
```

## Покрытие тестами

Тесты покрывают все handlers контроллера `UniversityBooksController`:

### 1. CreateBook (Создание книги)
- ✅ `CreateBook_ShouldCreateBook` - успешное создание книги
- ✅ `CreateBook_WithExistingTags_ShouldReuseTags` - переиспользование существующих тегов
- ✅ `CreateBook_WithoutDescription_ShouldCreateBook` - создание книги без описания
- ✅ `CreateBook_WithoutAuthor_ShouldCreateBook` - создание книги без автора

### 2. GetBookById (Получение книги по ID)
- ✅ `GetBookById_ShouldReturnBook` - успешное получение книги
- ✅ `GetBookById_WithInvalidId_ShouldThrowNotFoundException` - обработка несуществующей книги
- ✅ `GetBookById_WithFavoriteBook_ShouldShowIsFavorite` - отображение статуса избранного

### 3. GetBooks (Получение списка книг)
- ✅ `GetBooks_ShouldReturnAllBooks` - получение всех книг
- ✅ `GetBooks_WithTagFilter_ShouldReturnFilteredBooks` - фильтрация по тегам
- ✅ `GetBooks_WithMultipleTags_ShouldReturnBooksWithAnyTag` - фильтрация по нескольким тегам
- ✅ `GetBooks_ShouldIncludeFavoriteStatus` - включение статуса избранного

### 4. DeleteBook (Удаление книги)
- ✅ `DeleteBook_ShouldDeleteBook` - успешное удаление книги
- ✅ `DeleteBook_WithInvalidId_ShouldThrowNotFoundException` - обработка несуществующей книги

### 5. InvertFavoriteStatusBook (Инверсия статуса избранного)
- ✅ `InvertFavoriteStatusBook_WhenNotFavorite_ShouldAddToFavorites` - добавление в избранное
- ✅ `InvertFavoriteStatusBook_WhenFavorite_ShouldRemoveFromFavorites` - удаление из избранного

### 6. GetFavoriteBooks (Получение избранных книг)
- ✅ `GetFavoriteBooks_ShouldReturnFavoriteBooks` - получение избранных книг
- ✅ `GetFavoriteBooks_WithNoFavorites_ShouldReturnEmptyList` - пустой список избранных

### 7. GetTags (Получение тегов)
- ✅ `GetTags_ShouldReturnAllTags` - получение всех тегов
- ✅ `GetTags_WithNoTags_ShouldReturnEmptyList` - пустой список тегов

### 8. CreateTag (Создание тега)
- ✅ `CreateTag_ShouldCreateTag` - успешное создание тега

### 9. SearchBooks (Поиск книг)
- ✅ `SearchBooks_ShouldReturnMatchingBooks` - успешный поиск книг
- ✅ `SearchBooks_WithEmptyQuery_ShouldThrowBadRequestException` - обработка пустого запроса
- ✅ `SearchBooks_WithNullQuery_ShouldThrowBadRequestException` - обработка null запроса
- ✅ `SearchBooks_WithInvalidPage_ShouldUseDefaultPage` - валидация номера страницы
- ✅ `SearchBooks_WithInvalidPageSize_ShouldUseDefaultPageSize` - валидация размера страницы
- ✅ `SearchBooks_WithPageSizeExceedingMax_ShouldLimitToMax` - ограничение максимального размера страницы
- ✅ `SearchBooks_ShouldIncludeFavoriteStatus` - включение статуса избранного в результаты поиска

### 10. GetBookReservations (Получение резерваций книги)
- ✅ `GetBookReservations_ShouldReturnReservations` - получение резерваций
- ✅ `GetBookReservations_WithNoReservations_ShouldReturnEmptyList` - пустой список резерваций
- ✅ `GetBookReservations_WithUnknownUser_ShouldUseDefaultValues` - обработка неизвестных пользователей

### 11. ReservationBook (Создание резервации)
- ✅ `ReservationBook_ShouldCreateReservation` - успешное создание резервации
- ✅ `ReservationBook_WhenAlreadyReserved_ShouldThrowBadRequestException` - повторная резервация
- ✅ `ReservationBook_WithInvalidBookId_ShouldThrowNotFoundException` - обработка несуществующей книги
- ✅ `ReservationBook_WhenNoBooksAvailable_ShouldThrowBadRequestException` - отсутствие доступных книг

### 12. DeleteReservationBook (Удаление резервации)
- ✅ `DeleteReservationBook_ShouldDeleteReservation` - успешное удаление резервации
- ✅ `DeleteReservationBook_WhenNoReservation_ShouldNotThrow` - удаление несуществующей резервации
- ✅ `DeleteReservationBook_WithInvalidBookId_ShouldNotThrow` - обработка несуществующей книги

### 13. ExtendReservationBook (Продление резервации)
- ✅ `ExtendReservationBook_ShouldExtendReservation` - успешное продление резервации
- ✅ `ExtendReservationBook_WithNoReservation_ShouldThrowNotFoundException` - продление несуществующей резервации
- ✅ `ExtendReservationBook_WithInvalidBookId_ShouldThrowNotFoundException` - обработка несуществующей книги
- ✅ `ExtendReservationBook_WhenLimitReached_ShouldThrowBadRequestException` - превышение лимита продлений
- ✅ `ExtendReservationBook_MultipleTimes_ShouldExtendUpToLimit` - множественные продления до лимита

### 14. GetMyReservations (Получение резерваций пользователя)
- ✅ `GetMyReservations_ShouldReturnUserReservations` - получение резерваций пользователя
- ✅ `GetMyReservations_WithNoReservations_ShouldReturnEmptyList` - пустой список резерваций
- ✅ `GetMyReservations_ShouldIncludeFavoriteStatus` - включение статуса избранного
- ✅ `GetMyReservations_ShouldIncludeBookDetails` - включение деталей книги

**Всего тестов: 46**

## Структура тестов

Тесты используют:
- **In-Memory Database** для изоляции тестов
- **FluentAssertions** для читаемых проверок
- **Test helpers** для мокирования зависимостей:
  - `TestUserContextService` - мок сервиса пользователя (Auth.Domain.User)
  - `TestBookIndexingPublisher` - мок издателя индексации
  - `TestBookSearchService` - мок сервиса поиска
  - `TestJobsProvider` - мок провайдера задач (для планирования уведомлений)
  - `TestUserRepository` - мок репозитория пользователей (Users.Domain.User)
  - `TestBookRepository` - тестовая реализация репозитория книг

## Покрытие сценариев

### Успешные сценарии
- ✅ Создание, чтение, удаление книг
- ✅ Работа с тегами (создание, переиспользование)
- ✅ Управление избранными книгами
- ✅ Поиск и фильтрация книг
- ✅ Получение резерваций

### Обработка ошибок
- ✅ NotFoundException для несуществующих ресурсов
- ✅ BadRequestException для некорректных запросов
- ✅ Валидация параметров поиска

### Граничные случаи
- ✅ Книги без описания и автора
- ✅ Пустые списки и коллекции
- ✅ Валидация пагинации (страница, размер страницы)
- ✅ Обработка неизвестных пользователей в резервациях
- ✅ Лимит продлений резерваций (максимум 3 раза)
- ✅ Проверка доступности книг при резервации
- ✅ Изоляция резерваций между пользователями

## Особенности реализации

### Разрешение конфликтов имен
В проекте используются два разных типа `User`:
- `HacatonMax.University.Auth.Domain.User` - для аутентификации
- `HacatonMax.University.Users.Domain.User` - для пользовательских данных

В тестах используются алиасы:
- `AuthUser` для Auth.Domain.User
- `UsersUser` для Users.Domain.User

### Тестовая реализация репозитория
`TestBookRepository` реализует интерфейс `IBookRepository` и использует In-Memory базу данных для полной изоляции тестов.

