using HacatonMax.Common.Exceptions;
using HacatonMax.University.Library.Domain;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.Library.Infrastructure;

internal sealed class BookRepository : IBookRepository
{
    private readonly UniversityLibraryDbContext _context;

    public BookRepository(UniversityLibraryDbContext context)
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
        if (targetTags == null)
        {
            return await _context.Books
                .Include(x => x.Tags)
                .ToListAsync();
        }

        return await _context.Books
            .Where(x => x.Tags.Any(tag => targetTags.Contains(tag.Id)))
            .ToListAsync();
    }

    public Task<List<Tag>> GetTags()
    {
        return _context.Tags.AsNoTracking().ToListAsync();
    }

    public async Task InvertFavoriteBookStatus(long bookId, long userId)
    {
        var favoriteRecord = await _context.UserFavoriteBooks.FirstOrDefaultAsync(
            x => x.UserId == userId && x.BookId == bookId);

        if (favoriteRecord != null)
        {
            _context.UserFavoriteBooks.Remove(favoriteRecord);
        }
        else
        {
            var book = await _context.Books.FirstOrDefaultAsync(x => x.Id == bookId);
            _ = book == null
                ? throw new NotFoundException($"Книга с ID {bookId} не найдена")
                : await _context.UserFavoriteBooks.AddAsync(new UserFavoriteBook(userId, book.Id));
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<Tag>> ExistsTags(List<Guid> tagIds)
    {
        return await _context.Tags
            .Where(x => tagIds
                .Contains(x.Id))
            .ToListAsync();
    }

    public async Task SaveTags(List<Tag> tags)
    {
        await _context.Tags.AddRangeAsync(tags);
        await _context.SaveChangesAsync();
    }

    public Task<HashSet<long>> GetUserFavoriteBooks(long userId)
    {
        return _context.UserFavoriteBooks
            .Where(x => x.UserId == userId)
            .Select(x => x.BookId)
            .ToHashSetAsync();
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
        return _context.Books.FirstOrDefaultAsync(x => x.Id == bookId);
    }

    public Task<List<ReservationBook>> GetUserReservations(long userId)
    {
        return _context.ReservationBooks
            .Where(x => x.ReservationOwnerId == userId)
            .Include(x => x.Book)
                .ThenInclude(x => x.Tags)
            .ToListAsync();
    }

    public Task DeleteReservation(long bookId, long userId)
    {
        return _context.ReservationBooks
            .Where(x => x.BookId == bookId && x.ReservationOwnerId == userId)
            .ExecuteDeleteAsync();
    }

    public Task<List<Book>> GetFavoritesBook(long userId)
    {
        return _context.UserFavoriteBooks
            .Where(x => x.UserId == userId)
            .Include(x => x.Book)
            .ThenInclude(x => x.Tags)
            .Select(x => x.Book)
            .ToListAsync();
    }
}
