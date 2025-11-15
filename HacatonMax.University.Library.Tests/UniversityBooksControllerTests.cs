using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HacatonMax.Common.Exceptions;
using AuthUser = HacatonMax.University.Auth.Domain.User;
using UsersUser = HacatonMax.University.Users.Domain.User;
using HacatonMax.University.Auth.Domain;
using HacatonMax.University.Library.Application.Commands.CreateBook;
using HacatonMax.University.Library.Application.Commands.CreateTag;
using HacatonMax.University.Library.Application.Commands.DeleteBook;
using HacatonMax.University.Library.Application.Commands.GetBookById;
using HacatonMax.University.Library.Application.Commands.GetBookReservations;
using HacatonMax.University.Library.Application.Commands.GetBooks;
using HacatonMax.University.Library.Application.Commands.GetFavoriteBooks;
using HacatonMax.University.Library.Application.Commands.GetTags;
using HacatonMax.University.Library.Application.Commands.InvertFavoriteStatusBook;
using HacatonMax.University.Library.Application.Commands.SearchBooks;
using HacatonMax.University.Library.Application.Commands.ReservationBook;
using HacatonMax.University.Library.Application.Commands.DeleteReservationBook;
using HacatonMax.University.Library.Application.Commands.ExtendReservationBook;
using HacatonMax.University.Library.Application.Commands.GetMyReservations;
using HacatonMax.Common.Abstractions;
using HacatonMax.University.Library.Controllers.Dto;
using HacatonMax.University.Library.Domain;
using HacatonMax.University.Library.Infrastructure;
using HacatonMax.University.Users.Domain;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HacatonMax.University.Library.Tests;

public class UniversityBooksControllerTests : IDisposable
{
    private readonly UniversityLibraryDbContext _context;
    private readonly TestBookRepository _repository;

    public UniversityBooksControllerTests()
    {
        var options = new DbContextOptionsBuilder<UniversityLibraryDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new UniversityLibraryDbContext(options);
        _repository = new TestBookRepository(_context);
    }

    #region CreateBook Tests

    [Fact]
    public async Task CreateBook_ShouldCreateBook()
    {
        // Arrange
        var tags = new List<TagDto>
        {
            new TagDto(Guid.NewGuid(), "Fiction"),
            new TagDto(Guid.NewGuid(), "Adventure")
        };

        var command = new CreateBookCommand(
            "Test Book",
            "Test Description",
            "Test Author",
            10,
            tags);

        var handler = new CreateBookHandler(
            _repository,
            new TestBookIndexingPublisher());

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var books = await _repository.Get(null);
        books.Should().ContainSingle(b => b.Title == "Test Book");
        var createdBook = books.First(b => b.Title == "Test Book");
        createdBook.Description.Should().Be("Test Description");
        createdBook.Author.Should().Be("Test Author");
        createdBook.Count.Should().Be(10);
        createdBook.TakeCount.Should().Be(0);
        createdBook.Tags.Should().HaveCount(2);
    }

    [Fact]
    public async Task CreateBook_WithExistingTags_ShouldReuseTags()
    {
        // Arrange
        var existingTagId = Guid.NewGuid();
        var existingTag = new Tag(existingTagId, "Existing Tag");
        await _context.Tags.AddAsync(existingTag);
        await _context.SaveChangesAsync();

        var newTagId = Guid.NewGuid();
        var tags = new List<TagDto>
        {
            new TagDto(existingTagId, "Existing Tag"),
            new TagDto(newTagId, "New Tag")
        };

        var command = new CreateBookCommand(
            "Test Book",
            "Description",
            "Author",
            5,
            tags);

        var handler = new CreateBookHandler(
            _repository,
            new TestBookIndexingPublisher());

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var allTags = await _repository.GetTags();
        allTags.Should().Contain(t => t.Id == existingTagId);
        allTags.Should().Contain(t => t.Id == newTagId);

        var books = await _repository.Get(null);
        var createdBook = books.First(b => b.Title == "Test Book");
        createdBook.Tags.Should().HaveCount(2);
        createdBook.Tags.Should().Contain(t => t.Id == existingTagId);
        createdBook.Tags.Should().Contain(t => t.Id == newTagId);
    }

    [Fact]
    public async Task CreateBook_WithoutDescription_ShouldCreateBook()
    {
        // Arrange
        var command = new CreateBookCommand(
            "Book Without Description",
            null,
            "Author",
            5,
            new List<TagDto>());

        var handler = new CreateBookHandler(
            _repository,
            new TestBookIndexingPublisher());

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var books = await _repository.Get(null);
        var createdBook = books.First(b => b.Title == "Book Without Description");
        createdBook.Description.Should().BeNull();
    }

    [Fact]
    public async Task CreateBook_WithoutAuthor_ShouldCreateBook()
    {
        // Arrange
        var command = new CreateBookCommand(
            "Book Without Author",
            "Description",
            null,
            5,
            new List<TagDto>());

        var handler = new CreateBookHandler(
            _repository,
            new TestBookIndexingPublisher());

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var books = await _repository.Get(null);
        var createdBook = books.First(b => b.Title == "Book Without Author");
        createdBook.Author.Should().BeNull();
    }

    #endregion

    #region GetBookById Tests

    [Fact]
    public async Task GetBookById_ShouldReturnBook()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Test Book", "Description", "Author", 10);

        var handler = new GetBookByIdHandler(
            _repository,
            new TestUserContextService(userId));

        var command = new GetBookByIdCommand(bookId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(bookId);
        result.Title.Should().Be("Test Book");
        result.Description.Should().Be("Description");
        result.Author.Should().Be("Author");
        result.Count.Should().Be(10);
        result.IsFavorite.Should().BeFalse();
    }

    [Fact]
    public async Task GetBookById_WithInvalidId_ShouldThrowNotFoundException()
    {
        // Arrange
        var handler = new GetBookByIdHandler(
            _repository,
            new TestUserContextService(1L));

        var command = new GetBookByIdCommand(999L);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task GetBookById_WithFavoriteBook_ShouldShowIsFavorite()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Favorite Book", "Description", "Author", 10);

        var favoriteBook = new UserFavoriteBook(userId, bookId);
        await _context.UserFavoriteBooks.AddAsync(favoriteBook);
        await _context.SaveChangesAsync();

        var handler = new GetBookByIdHandler(
            _repository,
            new TestUserContextService(userId));

        var command = new GetBookByIdCommand(bookId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFavorite.Should().BeTrue();
    }

    #endregion

    #region GetBooks Tests

    [Fact]
    public async Task GetBooks_ShouldReturnAllBooks()
    {
        // Arrange
        var userId = 1L;
        await CreateTestBook("Book 1", "Description 1", "Author 1", 10);
        await CreateTestBook("Book 2", "Description 2", "Author 2", 5);

        var handler = new GetBooksHandler(
            _repository,
            new TestUserContextService(userId));

        var command = new GetBooksCommand(null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(b => b.Title == "Book 1");
        result.Should().Contain(b => b.Title == "Book 2");
    }

    [Fact]
    public async Task GetBooks_WithTagFilter_ShouldReturnFilteredBooks()
    {
        // Arrange
        var userId = 1L;
        var tagId = Guid.NewGuid();
        var tag = new Tag(tagId, "Fiction");
        await _context.Tags.AddAsync(tag);
        await _context.SaveChangesAsync();

        var book1 = await CreateTestBookWithTags("Fiction Book", new List<Guid> { tagId });
        await CreateTestBook("Other Book", "Description", "Author", 10);

        var handler = new GetBooksHandler(
            _repository,
            new TestUserContextService(userId));

        var command = new GetBooksCommand(new List<Guid> { tagId });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().ContainSingle(b => b.Id == book1);
        result.Should().NotContain(b => b.Title == "Other Book");
    }

    [Fact]
    public async Task GetBooks_WithMultipleTags_ShouldReturnBooksWithAnyTag()
    {
        // Arrange
        var userId = 1L;
        var tag1Id = Guid.NewGuid();
        var tag2Id = Guid.NewGuid();
        var tag1 = new Tag(tag1Id, "Fiction");
        var tag2 = new Tag(tag2Id, "Adventure");
        await _context.Tags.AddRangeAsync(tag1, tag2);
        await _context.SaveChangesAsync();

        var book1 = await CreateTestBookWithTags("Fiction Book", new List<Guid> { tag1Id });
        var book2 = await CreateTestBookWithTags("Adventure Book", new List<Guid> { tag2Id });
        await CreateTestBook("Other Book", "Description", "Author", 10);

        var handler = new GetBooksHandler(
            _repository,
            new TestUserContextService(userId));

        var command = new GetBooksCommand(new List<Guid> { tag1Id, tag2Id });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(b => b.Id == book1);
        result.Should().Contain(b => b.Id == book2);
    }

    [Fact]
    public async Task GetBooks_ShouldIncludeFavoriteStatus()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);

        var favoriteBook = new UserFavoriteBook(userId, bookId);
        await _context.UserFavoriteBooks.AddAsync(favoriteBook);
        await _context.SaveChangesAsync();

        var handler = new GetBooksHandler(
            _repository,
            new TestUserContextService(userId));

        var command = new GetBooksCommand(null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        var book = result.First(b => b.Id == bookId);
        book.IsFavorite.Should().BeTrue();
    }

    #endregion

    #region DeleteBook Tests

    [Fact]
    public async Task DeleteBook_ShouldDeleteBook()
    {
        // Arrange
        var bookId = await CreateTestBook("Book to Delete", "Description", "Author", 10);

        var handler = new DeleteBookHandler(
            _repository,
            new TestBookIndexingPublisher());

        var command = new DeleteBookCommand(bookId);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var deletedBook = await _repository.GetBookById(bookId);
        deletedBook.Should().BeNull();
    }

    [Fact]
    public async Task DeleteBook_WithInvalidId_ShouldThrowNotFoundException()
    {
        // Arrange
        var handler = new DeleteBookHandler(
            _repository,
            new TestBookIndexingPublisher());

        var command = new DeleteBookCommand(999L);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    #endregion

    #region InvertFavoriteStatusBook Tests

    [Fact]
    public async Task InvertFavoriteStatusBook_WhenNotFavorite_ShouldAddToFavorites()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);

        var handler = new InvertFavoriteStatusBookHandler(
            _repository,
            new TestUserContextService(userId));

        var command = new InvertFavoriteStatusBookCommand(bookId);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var favoriteBooks = await _repository.GetUserFavoriteBooks(userId);
        favoriteBooks.Should().Contain(b => b.Id == bookId);
    }

    [Fact]
    public async Task InvertFavoriteStatusBook_WhenFavorite_ShouldRemoveFromFavorites()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);

        var favoriteBook = new UserFavoriteBook(userId, bookId);
        await _context.UserFavoriteBooks.AddAsync(favoriteBook);
        await _context.SaveChangesAsync();

        var handler = new InvertFavoriteStatusBookHandler(
            _repository,
            new TestUserContextService(userId));

        var command = new InvertFavoriteStatusBookCommand(bookId);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var favoriteBooks = await _repository.GetUserFavoriteBooks(userId);
        favoriteBooks.Should().NotContain(b => b.Id == bookId);
    }

    #endregion

    #region GetFavoriteBooks Tests

    [Fact]
    public async Task GetFavoriteBooks_ShouldReturnFavoriteBooks()
    {
        // Arrange
        var userId = 1L;
        var book1Id = await CreateTestBook("Favorite Book 1", "Description", "Author", 10);
        var book2Id = await CreateTestBook("Favorite Book 2", "Description", "Author", 5);
        await CreateTestBook("Not Favorite Book", "Description", "Author", 10);

        var favorite1 = new UserFavoriteBook(userId, book1Id);
        var favorite2 = new UserFavoriteBook(userId, book2Id);
        await _context.UserFavoriteBooks.AddRangeAsync(favorite1, favorite2);
        await _context.SaveChangesAsync();

        var handler = new GetFavoriteBooksHandler(
            _repository,
            new TestUserContextService(userId));

        var command = new GetFavoriteBooksCommand();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(b => b.Id == book1Id);
        result.Should().Contain(b => b.Id == book2Id);
        result.Should().NotContain(b => b.Title == "Not Favorite Book");
        result.All(b => b.IsFavorite).Should().BeTrue();
    }

    [Fact]
    public async Task GetFavoriteBooks_WithNoFavorites_ShouldReturnEmptyList()
    {
        // Arrange
        var userId = 1L;
        await CreateTestBook("Book", "Description", "Author", 10);

        var handler = new GetFavoriteBooksHandler(
            _repository,
            new TestUserContextService(userId));

        var command = new GetFavoriteBooksCommand();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region GetTags Tests

    [Fact]
    public async Task GetTags_ShouldReturnAllTags()
    {
        // Arrange
        var tag1 = new Tag(Guid.NewGuid(), "Fiction");
        var tag2 = new Tag(Guid.NewGuid(), "Adventure");
        await _context.Tags.AddRangeAsync(tag1, tag2);
        await _context.SaveChangesAsync();

        var handler = new GetTagsHandler(_repository);
        var command = new GetTagsCommand();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(t => t.Name == "Fiction");
        result.Should().Contain(t => t.Name == "Adventure");
    }

    [Fact]
    public async Task GetTags_WithNoTags_ShouldReturnEmptyList()
    {
        // Arrange
        var handler = new GetTagsHandler(_repository);
        var command = new GetTagsCommand();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region CreateTag Tests

    [Fact]
    public async Task CreateTag_ShouldCreateTag()
    {
        // Arrange
        var handler = new CreateTagHandler(_repository);
        var command = new CreateTagCommand("New Tag");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("New Tag");

        var allTags = await _repository.GetTags();
        allTags.Should().Contain(t => t.Name == "New Tag");
    }

    #endregion

    #region SearchBooks Tests

    [Fact]
    public async Task SearchBooks_ShouldReturnMatchingBooks()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Technology Book", "Description", "Author", 10);
        await CreateTestBook("Music Book", "Description", "Author", 5);

        var searchResult = new BookSearchResult(
            new List<BookSearchItem>
            {
                new BookSearchItem(
                    bookId,
                    "Technology Book",
                    "Description",
                    "Author",
                    10,
                    0,
                    new List<Tag>(),
                    1.0)
            },
            1,
            1,
            20);

        var handler = new SearchBooksHandler(
            _repository,
            new TestBookSearchService(searchResult),
            new TestUserContextService(userId));

        var command = new SearchBooksCommand(
            "Technology",
            null,
            1,
            20);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Books.Should().ContainSingle(b => b.Title == "Technology Book");
        result.Books.Should().NotContain(b => b.Title == "Music Book");
        result.Total.Should().Be(1);
    }

    [Fact]
    public async Task SearchBooks_WithEmptyQuery_ShouldThrowBadRequestException()
    {
        // Arrange
        var handler = new SearchBooksHandler(
            _repository,
            new TestBookSearchService(null),
            new TestUserContextService(1L));

        var command = new SearchBooksCommand(
            "   ",
            null,
            1,
            20);

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task SearchBooks_WithNullQuery_ShouldThrowBadRequestException()
    {
        // Arrange
        var handler = new SearchBooksHandler(
            _repository,
            new TestBookSearchService(null),
            new TestUserContextService(1L));

        var command = new SearchBooksCommand(
            string.Empty,
            null,
            1,
            20);

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task SearchBooks_WithInvalidPage_ShouldUseDefaultPage()
    {
        // Arrange
        var userId = 1L;
        var searchResult = new BookSearchResult(
            new List<BookSearchItem>(),
            0,
            1,
            20);

        var handler = new SearchBooksHandler(
            _repository,
            new TestBookSearchService(searchResult),
            new TestUserContextService(userId));

        var command = new SearchBooksCommand(
            "test",
            null,
            0,
            20);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Page.Should().Be(1);
    }

    [Fact]
    public async Task SearchBooks_WithInvalidPageSize_ShouldUseDefaultPageSize()
    {
        // Arrange
        var userId = 1L;
        var searchResult = new BookSearchResult(
            new List<BookSearchItem>(),
            0,
            1,
            20);

        var handler = new SearchBooksHandler(
            _repository,
            new TestBookSearchService(searchResult),
            new TestUserContextService(userId));

        var command = new SearchBooksCommand(
            "test",
            null,
            1,
            0);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.PageSize.Should().Be(20);
    }

    [Fact]
    public async Task SearchBooks_WithPageSizeExceedingMax_ShouldLimitToMax()
    {
        // Arrange
        var userId = 1L;
        var searchResult = new BookSearchResult(
            new List<BookSearchItem>(),
            0,
            1,
            50);

        var handler = new SearchBooksHandler(
            _repository,
            new TestBookSearchService(searchResult),
            new TestUserContextService(userId));

        var command = new SearchBooksCommand(
            "test",
            null,
            1,
            100);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.PageSize.Should().Be(50);
    }

    [Fact]
    public async Task SearchBooks_ShouldIncludeFavoriteStatus()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);

        var favoriteBook = new UserFavoriteBook(userId, bookId);
        await _context.UserFavoriteBooks.AddAsync(favoriteBook);
        await _context.SaveChangesAsync();

        var searchResult = new BookSearchResult(
            new List<BookSearchItem>
            {
                new BookSearchItem(
                    bookId,
                    "Book",
                    "Description",
                    "Author",
                    10,
                    0,
                    new List<Tag>(),
                    1.0)
            },
            1,
            1,
            20);

        var handler = new SearchBooksHandler(
            _repository,
            new TestBookSearchService(searchResult),
            new TestUserContextService(userId));

        var command = new SearchBooksCommand(
            "Book",
            null,
            1,
            20);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        var book = result.Books.First(b => b.Id == bookId);
        book.IsFavorite.Should().BeTrue();
    }

    #endregion

    #region GetBookReservations Tests

    [Fact]
    public async Task GetBookReservations_ShouldReturnReservation()
    {
        // Arrange
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);
        var userId = 1L;

        var reservation = new ReservationBook(
            bookId,
            userId,
            DateTimeOffset.UtcNow.AddDays(7));

        await _context.ReservationBooks.AddAsync(reservation);
        await _context.SaveChangesAsync();

        var user = new UsersUser(userId, "John", "Doe", "johndoe", "john@example.com");

        var handler = new GetBookReservationsHandler(
            _repository,
            new TestUserRepository(new List<UsersUser> { user }));

        var command = new GetBookReservationsCommand(bookId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().ContainSingle();
        result.Should().Contain(r => r.ReservationOwnerId == userId);
        result.First().OwnerFirstName.Should().Be("John");
        result.First().OwnerLastName.Should().Be("Doe");
    }

    [Fact]
    public async Task GetBookReservations_WithNoReservations_ShouldReturnEmptyList()
    {
        // Arrange
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);

        var handler = new GetBookReservationsHandler(
            _repository,
            new TestUserRepository(new List<UsersUser>()));

        var command = new GetBookReservationsCommand(bookId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetBookReservations_WithUnknownUser_ShouldUseDefaultValues()
    {
        // Arrange
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);
        var userId = 999L;

        var reservation = new ReservationBook(
            bookId,
            userId,
            DateTimeOffset.UtcNow.AddDays(7));

        await _context.ReservationBooks.AddAsync(reservation);
        await _context.SaveChangesAsync();

        var handler = new GetBookReservationsHandler(
            _repository,
            new TestUserRepository(new List<UsersUser>()));

        var command = new GetBookReservationsCommand(bookId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().ContainSingle();
        var reservationDto = result.First();
        reservationDto.OwnerFirstName.Should().Be("Неизвестно");
        reservationDto.OwnerLastName.Should().Be("");
    }

    #endregion

    #region ReservationBook Tests

    [Fact]
    public async Task ReservationBook_ShouldCreateReservation()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);

        var handler = new ReservationBookHandler(
            _repository,
            new TestUserContextService(userId),
            new TestJobsProvider(),
            new TestBookIndexingPublisher());

        var command = new ReservationBookCommand(bookId);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var reservation = await _repository.GetReservationBook(bookId, userId);
        reservation.Should().NotBeNull();
        reservation!.ReservationOwnerId.Should().Be(userId);
        reservation.BookId.Should().Be(bookId);
        reservation.EndReservationDate.Should().BeCloseTo(DateTimeOffset.UtcNow.AddDays(7), TimeSpan.FromMinutes(1));

        var book = await _repository.GetBookById(bookId);
        book!.TakeCount.Should().Be(1);
    }

    [Fact]
    public async Task ReservationBook_WhenAlreadyReserved_ShouldThrowBadRequestException()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);

        var existingReservation = new ReservationBook(
            bookId,
            userId,
            DateTimeOffset.UtcNow.AddDays(7));
        await _context.ReservationBooks.AddAsync(existingReservation);
        await _context.SaveChangesAsync();

        var handler = new ReservationBookHandler(
            _repository,
            new TestUserContextService(userId),
            new TestJobsProvider(),
            new TestBookIndexingPublisher());

        var command = new ReservationBookCommand(bookId);

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task ReservationBook_WithInvalidBookId_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = 1L;

        var handler = new ReservationBookHandler(
            _repository,
            new TestUserContextService(userId),
            new TestJobsProvider(),
            new TestBookIndexingPublisher());

        var command = new ReservationBookCommand(999L);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task ReservationBook_WhenNoBooksAvailable_ShouldThrowBadRequestException()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Book", "Description", "Author", 1);

        // Take all books
        var book = await _repository.GetBookById(bookId);
        book!.Take();
        await _repository.SaveChanges();

        var handler = new ReservationBookHandler(
            _repository,
            new TestUserContextService(userId),
            new TestJobsProvider(),
            new TestBookIndexingPublisher());

        var command = new ReservationBookCommand(bookId);

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    #endregion

    #region DeleteReservationBook Tests

    [Fact]
    public async Task DeleteReservationBook_ShouldDeleteReservation()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);

        var reservation = new ReservationBook(
            bookId,
            userId,
            DateTimeOffset.UtcNow.AddDays(7));
        await _context.ReservationBooks.AddAsync(reservation);
        
        var book = await _repository.GetBookById(bookId);
        book!.Take();
        await _context.SaveChangesAsync();

        var handler = new DeleteReservationBookHandler(
            _repository,
            new TestUserContextService(userId),
            new TestJobsProvider(),
            new TestBookIndexingPublisher());

        var command = new DeleteReservationBookCommand(bookId);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var deletedReservation = await _repository.GetReservationBook(bookId, userId);
        deletedReservation.Should().BeNull();

        var updatedBook = await _repository.GetBookById(bookId);
        updatedBook!.TakeCount.Should().Be(0);
    }

    [Fact]
    public async Task DeleteReservationBook_WhenNoReservation_ShouldNotThrow()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);

        var handler = new DeleteReservationBookHandler(
            _repository,
            new TestUserContextService(userId),
            new TestJobsProvider(),
            new TestBookIndexingPublisher());

        var command = new DeleteReservationBookCommand(bookId);

        // Act & Assert - should not throw
        await handler.Handle(command, CancellationToken.None);
    }

    [Fact]
    public async Task DeleteReservationBook_WithInvalidBookId_ShouldNotThrow()
    {
        // Arrange
        var userId = 1L;

        var handler = new DeleteReservationBookHandler(
            _repository,
            new TestUserContextService(userId),
            new TestJobsProvider(),
            new TestBookIndexingPublisher());

        var command = new DeleteReservationBookCommand(999L);

        // Act & Assert - should not throw
        await handler.Handle(command, CancellationToken.None);
    }

    #endregion

    #region ExtendReservationBook Tests

    [Fact]
    public async Task ExtendReservationBook_ShouldExtendReservation()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);

        var originalEndDate = DateTimeOffset.UtcNow.AddDays(7);
        var reservation = new ReservationBook(
            bookId,
            userId,
            originalEndDate);
        await _context.ReservationBooks.AddAsync(reservation);
        await _context.SaveChangesAsync();

        var handler = new ExtendReservationBookHandler(
            _repository,
            new TestUserContextService(userId),
            new TestJobsProvider());

        var command = new ExtendReservationBookCommand(bookId);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var extendedReservation = await _repository.GetReservationBook(bookId, userId);
        extendedReservation.Should().NotBeNull();
        extendedReservation!.EndReservationDate.Should().BeCloseTo(originalEndDate.AddDays(7), TimeSpan.FromMinutes(1));
        extendedReservation.CountExtendReservation.Should().Be(1);
    }

    [Fact]
    public async Task ExtendReservationBook_WithNoReservation_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);

        var handler = new ExtendReservationBookHandler(
            _repository,
            new TestUserContextService(userId),
            new TestJobsProvider());

        var command = new ExtendReservationBookCommand(bookId);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task ExtendReservationBook_WithInvalidBookId_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = 1L;

        var handler = new ExtendReservationBookHandler(
            _repository,
            new TestUserContextService(userId),
            new TestJobsProvider());

        var command = new ExtendReservationBookCommand(999L);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task ExtendReservationBook_WhenLimitReached_ShouldThrowBadRequestException()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);

        var reservation = new ReservationBook(
            bookId,
            userId,
            DateTimeOffset.UtcNow.AddDays(7));
        
        // Extend 3 times manually
        reservation.ExtendReservation();
        reservation.ExtendReservation();
        reservation.ExtendReservation();

        await _context.ReservationBooks.AddAsync(reservation);
        await _context.SaveChangesAsync();

        var handler = new ExtendReservationBookHandler(
            _repository,
            new TestUserContextService(userId),
            new TestJobsProvider());

        var command = new ExtendReservationBookCommand(bookId);

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task ExtendReservationBook_MultipleTimes_ShouldExtendUpToLimit()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Book", "Description", "Author", 10);

        var originalEndDate = DateTimeOffset.UtcNow.AddDays(7);
        var reservation = new ReservationBook(
            bookId,
            userId,
            originalEndDate);
        await _context.ReservationBooks.AddAsync(reservation);
        await _context.SaveChangesAsync();

        var handler = new ExtendReservationBookHandler(
            _repository,
            new TestUserContextService(userId),
            new TestJobsProvider());

        // Act - extend 3 times
        await handler.Handle(new ExtendReservationBookCommand(bookId), CancellationToken.None);
        await handler.Handle(new ExtendReservationBookCommand(bookId), CancellationToken.None);
        await handler.Handle(new ExtendReservationBookCommand(bookId), CancellationToken.None);

        // Assert
        var extendedReservation = await _repository.GetReservationBook(bookId, userId);
        extendedReservation.Should().NotBeNull();
        extendedReservation!.EndReservationDate.Should().BeCloseTo(originalEndDate.AddDays(21), TimeSpan.FromMinutes(1));
        extendedReservation.CountExtendReservation.Should().Be(3);
    }

    #endregion

    #region GetMyReservations Tests

    [Fact]
    public async Task GetMyReservations_ShouldReturnUserReservations()
    {
        // Arrange
        var userId = 1L;
        var otherUserId = 2L;
        var book1Id = await CreateTestBook("Book 1", "Description", "Author", 10);
        var book2Id = await CreateTestBook("Book 2", "Description", "Author", 10);
        var book3Id = await CreateTestBook("Book 3", "Description", "Author", 10);

        var reservation1 = new ReservationBook(
            book1Id,
            userId,
            DateTimeOffset.UtcNow.AddDays(7));
        var reservation2 = new ReservationBook(
            book2Id,
            userId,
            DateTimeOffset.UtcNow.AddDays(14));
        var reservation3 = new ReservationBook(
            book3Id,
            otherUserId,
            DateTimeOffset.UtcNow.AddDays(7));

        await _context.ReservationBooks.AddRangeAsync(reservation1, reservation2, reservation3);
        await _context.SaveChangesAsync();

        var handler = new GetMyReservationsHandler(
            _repository,
            new TestUserContextService(userId));

        var command = new GetMyReservationsCommand();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(r => r.Book.Id == book1Id);
        result.Should().Contain(r => r.Book.Id == book2Id);
        result.Should().NotContain(r => r.Book.Id == book3Id);
    }

    [Fact]
    public async Task GetMyReservations_WithNoReservations_ShouldReturnEmptyList()
    {
        // Arrange
        var userId = 1L;
        await CreateTestBook("Book", "Description", "Author", 10);

        var handler = new GetMyReservationsHandler(
            _repository,
            new TestUserContextService(userId));

        var command = new GetMyReservationsCommand();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetMyReservations_ShouldIncludeFavoriteStatus()
    {
        // Arrange
        var userId = 1L;
        var book1Id = await CreateTestBook("Favorite Book", "Description", "Author", 10);
        var book2Id = await CreateTestBook("Regular Book", "Description", "Author", 10);

        var favoriteBook = new UserFavoriteBook(userId, book1Id);
        await _context.UserFavoriteBooks.AddAsync(favoriteBook);

        var reservation1 = new ReservationBook(
            book1Id,
            userId,
            DateTimeOffset.UtcNow.AddDays(7));
        var reservation2 = new ReservationBook(
            book2Id,
            userId,
            DateTimeOffset.UtcNow.AddDays(7));

        await _context.ReservationBooks.AddRangeAsync(reservation1, reservation2);
        await _context.SaveChangesAsync();

        var handler = new GetMyReservationsHandler(
            _repository,
            new TestUserContextService(userId));

        var command = new GetMyReservationsCommand();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        var favoriteReservation = result.First(r => r.Book.Id == book1Id);
        favoriteReservation.Book.IsFavorite.Should().BeTrue();

        var regularReservation = result.First(r => r.Book.Id == book2Id);
        regularReservation.Book.IsFavorite.Should().BeFalse();
    }

    [Fact]
    public async Task GetMyReservations_ShouldIncludeBookDetails()
    {
        // Arrange
        var userId = 1L;
        var bookId = await CreateTestBook("Test Book", "Test Description", "Test Author", 10);

        var reservation = new ReservationBook(
            bookId,
            userId,
            DateTimeOffset.UtcNow.AddDays(7));
        await _context.ReservationBooks.AddAsync(reservation);
        await _context.SaveChangesAsync();

        var handler = new GetMyReservationsHandler(
            _repository,
            new TestUserContextService(userId));

        var command = new GetMyReservationsCommand();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().ContainSingle();
        var reservationDto = result.First();
        reservationDto.Book.Id.Should().Be(bookId);
        reservationDto.Book.Title.Should().Be("Test Book");
        reservationDto.Book.Description.Should().Be("Test Description");
        reservationDto.Book.Author.Should().Be("Test Author");
        reservationDto.EndReservationDate.Should().BeCloseTo(DateTimeOffset.UtcNow.AddDays(7), TimeSpan.FromMinutes(1));
    }

    #endregion

    #region Helper Methods

    private async Task<long> CreateTestBook(
        string title,
        string? description,
        string? author,
        long count)
    {
        var book = new Book(
            title,
            description,
            count,
            0,
            new List<Tag>(),
            author);

        await _repository.Save(book);
        return book.Id;
    }

    private async Task<long> CreateTestBookWithTags(
        string title,
        List<Guid> tagIds)
    {
        var tags = new List<Tag>();
        foreach (var tagId in tagIds)
        {
            var existingTag = await _context.Tags.FirstOrDefaultAsync(t => t.Id == tagId);
            if (existingTag == null)
            {
                existingTag = new Tag(tagId, $"Tag {tagId}");
                await _context.Tags.AddAsync(existingTag);
                await _context.SaveChangesAsync();
            }
            tags.Add(existingTag);
        }

        var book = new Book(
            title,
            "Description",
            10,
            0,
            tags,
            "Author");

        await _repository.Save(book);
        return book.Id;
    }

    #endregion

    public void Dispose()
    {
        _context?.Dispose();
    }
}

// Test helpers
internal class TestUserContextService : IUserContextService
{
    private readonly long? _userId;

    public TestUserContextService(long? userId = null)
    {
        _userId = userId;
    }

    public AuthUser GetCurrentUser()
    {
        var user = GetCurrentUserOrDefault();
        if (user == null)
        {
            throw new ForbiddenException("User is not authenticated in test context.");
        }

        return user;
    }

    public AuthUser? GetCurrentUserOrDefault()
    {
        return _userId.HasValue
            ? new AuthUser(_userId.Value, "Test", "User", "testuser")
            : null;
    }
}

internal class TestBookIndexingPublisher : IBookIndexingPublisher
{
    public Task PublishIndex(long bookId, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task PublishRemove(long bookId, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}

internal class TestJobsProvider : IJobsProvider
{
    public Task ScheduleJobWithTag<T>(System.Linq.Expressions.Expression<Func<T, Task>> methodCall, string tag, DateTimeOffset? enqueueAt = null)
    {
        return Task.CompletedTask;
    }

    public Task DeleteJob(string tag)
    {
        return Task.CompletedTask;
    }
}

internal class TestBookSearchService : IBookSearchService
{
    private readonly BookSearchResult? _searchResult;

    public TestBookSearchService(BookSearchResult? searchResult)
    {
        _searchResult = searchResult;
    }

    public Task EnsureIndex()
    {
        return Task.CompletedTask;
    }

    public Task<bool> Index(Book book)
    {
        return Task.FromResult(true);
    }

    public Task IndexMany(IReadOnlyCollection<Book> books)
    {
        return Task.CompletedTask;
    }

    public Task<bool> Remove(long bookId)
    {
        return Task.FromResult(true);
    }

    public Task<BookSearchResult> Search(BookSearchRequest request)
    {
        if (_searchResult == null)
        {
            return Task.FromResult(new BookSearchResult(
                new List<BookSearchItem>(),
                0,
                request.Page,
                request.PageSize));
        }

        return Task.FromResult(_searchResult);
    }
}

internal class TestUserRepository : IUserRepository
{
    private readonly List<UsersUser> _users;

    public TestUserRepository(List<UsersUser> users)
    {
        _users = users;
    }

    public Task<UsersUser?> GetById(long id)
    {
        return Task.FromResult(_users.FirstOrDefault(u => u.Id == id));
    }

    public Task<List<UsersUser>> GetByIds(List<long> userIds)
    {
        return Task.FromResult(_users.Where(u => userIds.Contains(u.Id)).ToList());
    }

    public Task<UsersUser?> GetByUsername(string username)
    {
        return Task.FromResult(_users.FirstOrDefault(u => u.Username == username));
    }

    public Task<List<UsersUser>> GetByUniversityId(long universityId)
    {
        return Task.FromResult(new List<UsersUser>());
    }

    public Task Save(UsersUser user)
    {
        return Task.CompletedTask;
    }

    public Task SaveRange(List<UsersUser> users)
    {
        return Task.CompletedTask;
    }
}

internal class TestBookRepository : IBookRepository
{
    private readonly UniversityLibraryDbContext _context;

    public TestBookRepository(UniversityLibraryDbContext context)
    {
        _context = context;
    }

    public async Task Save(Book book)
    {
        await _context.AddAsync(book);
        await _context.SaveChangesAsync();
    }

    public async Task<List<Book>> Get(List<Guid>? targetTags = null)
    {
        IQueryable<Book> query = _context.Books
            .Include(x => x.Tags)
            .AsSplitQuery();

        if (targetTags != null && targetTags.Count > 0)
        {
            query = query.Where(x => x.Tags.Any(t => targetTags.Contains(t.Id)));
        }

        return await query.ToListAsync();
    }

    public Task<List<Tag>> GetTags()
    {
        return _context.Tags.ToListAsync();
    }

    public async Task InvertFavoriteBookStatus(long bookId, long userId)
    {
        var existing = await _context.UserFavoriteBooks
            .FirstOrDefaultAsync(f => f.BookId == bookId && f.UserId == userId);

        if (existing != null)
        {
            _context.UserFavoriteBooks.Remove(existing);
        }
        else
        {
            await _context.UserFavoriteBooks.AddAsync(new UserFavoriteBook(userId, bookId));
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<Tag>> ExistsTags(List<Guid> tagIds)
    {
        return await _context.Tags
            .Where(x => tagIds.Contains(x.Id))
            .ToListAsync();
    }

    public async Task SaveTags(List<Tag> tags)
    {
        await _context.Tags.AddRangeAsync(tags);
        await _context.SaveChangesAsync();
    }

    public async Task<HashSet<long>> GetUserFavoriteBookIds(long userId)
    {
        var favoriteBooks = await _context.UserFavoriteBooks
            .Where(f => f.UserId == userId)
            .Select(f => f.BookId)
            .ToListAsync();

        return favoriteBooks.ToHashSet();
    }

    public async Task<ReservationBook> ReservationBook(long bookId, long userId)
    {
        var result = await _context.ReservationBooks.AddAsync(
            new ReservationBook(bookId, userId, DateTimeOffset.UtcNow.AddDays(7)));
        await _context.SaveChangesAsync();

        return result.Entity;
    }

    public Task<ReservationBook?> GetReservationBook(long bookId, long userId)
    {
        return _context.ReservationBooks
            .Include(x => x.Book)
            .FirstOrDefaultAsync(x => x.BookId == bookId && x.ReservationOwnerId == userId);
    }

    public Task SaveChanges()
    {
        return _context.SaveChangesAsync();
    }

    public Task<Book?> GetBookById(long bookId)
    {
        return _context.Books
            .Include(x => x.Tags)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.Id == bookId);
    }

    public Task<List<ReservationBook>> GetUserReservations(long userId)
    {
        return _context.ReservationBooks
            .Where(x => x.ReservationOwnerId == userId)
            .Include(x => x.Book)
                .ThenInclude(x => x.Tags)
            .ToListAsync();
    }

    public async Task<List<ReservationBook>> GetBookReservations(long bookId)
    {
        return await _context.ReservationBooks
            .Where(r => r.BookId == bookId)
            .ToListAsync();
    }

    public async Task DeleteReservation(long bookId, long userId)
    {
        var reservation = await _context.ReservationBooks
            .FirstOrDefaultAsync(x => x.BookId == bookId && x.ReservationOwnerId == userId);

        if (reservation != null)
        {
            _context.ReservationBooks.Remove(reservation);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<Book>> GetUserFavoriteBooks(long userId)
    {
        var favoriteBookIds = await _context.UserFavoriteBooks
            .Where(f => f.UserId == userId)
            .Select(f => f.BookId)
            .ToListAsync();

        return await _context.Books
            .Where(b => favoriteBookIds.Contains(b.Id))
            .Include(b => b.Tags)
            .AsSplitQuery()
            .ToListAsync();
    }

    public async Task DeleteBook(Book book)
    {
        _context.Books.Remove(book);
        await _context.SaveChangesAsync();
    }
}

