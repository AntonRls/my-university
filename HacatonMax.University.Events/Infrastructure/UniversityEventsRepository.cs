using HacatonMax.University.Events.Domain;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.Events.Infrastructure;

internal sealed class UniversityEventsRepository : IUniversityEventsRepository
{
    private readonly UniversityEventsDbContext _context;

    public UniversityEventsRepository(UniversityEventsDbContext context)
    {
        _context = context;
    }

    public async Task Save(UniversityEvent universityEvent)
    {
        await _context.AddAsync(universityEvent);
        await _context.SaveChangesAsync();
    }

    public async Task<List<UniversityEvent>> Get(List<Guid>? tags)
    {
        // TODO: Сюда еще добавить проверку на isFavorite

        if (tags == null)
        {
            return await _context.UniversityEvents.Include(x => x.Tags).ToListAsync();
        }

        return await _context.UniversityEvents
            .Where(x => x.Tags.Any(t => tags.Contains(t.Id)))
            .Include(x => x.Tags)
            .ToListAsync();
    }

    public Task<List<Tag>> GetTags()
    {
        return _context.Tags.ToListAsync();
    }

    public async Task<List<Tag>> GetExistsTags(List<Guid> tagIds)
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

    public Task<UniversityEvent?> GetById(long eventId)
    {
        return _context.UniversityEvents
            .Include(x => x.Tags)
            .FirstOrDefaultAsync(x => x.Id == eventId);
    }

    public async Task<List<UniversityEvent>> GetByIds(List<long> eventIds)
    {
        if (eventIds.Count == 0)
        {
            return new List<UniversityEvent>();
        }

        return await _context.UniversityEvents
            .Where(x => eventIds.Contains(x.Id))
            .Include(x => x.Tags)
            .ToListAsync();
    }

    public async Task Delete(UniversityEvent universityEvent)
    {
        _context.UniversityEvents.Remove(universityEvent);
        await _context.SaveChangesAsync();
    }

    public Task SaveChanges()
    {
        return _context.SaveChangesAsync();
    }
}
