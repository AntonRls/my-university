using System.Linq;
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

        IQueryable<UniversityEvent> query = _context.UniversityEvents
            .Include(x => x.Tags)
            .Include(x => x.Registrations)
            .AsSplitQuery();

        if (tags != null)
        {
            query = query.Where(x => x.Tags.Any(t => tags.Contains(t.Id)));
        }

        return await query.ToListAsync();
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

    public Task<List<UniversityEvent>> Search(string query)
    {
        var pattern = $"%{query}%";

        return _context.UniversityEvents
            .Where(x => EF.Functions.ILike(x.Title, pattern) || EF.Functions.ILike(x.Description, pattern))
            .Include(x => x.Tags)
            .Include(x => x.Registrations)
            .AsSplitQuery()
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
            .Include(x => x.Registrations)
            .AsSplitQuery()
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
            .Include(x => x.Registrations)
            .AsSplitQuery()
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

    public Task<int> GetRegistrationsCount(long eventId)
    {
        return _context.UniversityEventRegistrations
            .Where(registration => registration.UniversityEventId == eventId)
            .CountAsync();
    }

    public Task<bool> HasUserRegistration(long eventId, long userId)
    {
        return _context.UniversityEventRegistrations
            .AnyAsync(registration => registration.UniversityEventId == eventId && registration.UserId == userId);
    }

    public async Task AddRegistration(UniversityEventRegistration registration)
    {
        await _context.UniversityEventRegistrations.AddAsync(registration);
        await _context.SaveChangesAsync();
    }

    public Task<List<UniversityEventRegistration>> GetRegistrationsForEvent(long eventId)
    {
        return _context.UniversityEventRegistrations
            .Where(registration => registration.UniversityEventId == eventId)
            .ToListAsync();
    }

    public Task<UniversityEventRegistration?> GetUserRegistration(long eventId, long userId)
    {
        return _context.UniversityEventRegistrations
            .FirstOrDefaultAsync(registration => registration.UniversityEventId == eventId && registration.UserId == userId);
    }

    public async Task RemoveRegistration(UniversityEventRegistration registration)
    {
        _context.UniversityEventRegistrations.Remove(registration);
        await _context.SaveChangesAsync();
    }
}
