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
        var existsTags = await GetExistsTags(universityEvent.Tags);
        foreach (var notExistsTag in universityEvent.Tags.Except(existsTags))
        {
            await _context.Tags.AddAsync(notExistsTag);
        }

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

    private async Task<List<Tag>> GetExistsTags(List<Tag> tags)
    {
        return await _context.Tags.Where(x => tags.Select(tag => tag.Id).Contains(x.Id)).ToListAsync();
    }
}
