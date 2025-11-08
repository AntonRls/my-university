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
        var existsTags = await ExistsTags(book.Tags);

        foreach (var noneExistsTag in book.Tags.Except(existsTags))
        {
            await _context.Tags.AddAsync(noneExistsTag);
        }

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

    private async Task<List<Tag>> ExistsTags(List<Tag> tags)
    {
        return await _context.Tags
            .Where(x => tags
                .Select(tag => tag.Id)
                .Contains(x.Id))
            .AsNoTracking()
            .ToListAsync();
    }
}
