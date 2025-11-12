namespace HacatonMax.University.Events.Domain;

public interface IUniversityEventsRepository
{
    Task Save(UniversityEvent universityEvent);

    Task<List<UniversityEvent>> Get(List<Guid>? tags);

    Task<List<Tag>> GetTags();

    Task<List<Tag>> GetExistsTags(List<Guid> tagIds);

    Task SaveTags(List<Tag> tags);

    Task<UniversityEvent?> GetById(long eventId);

    Task<List<UniversityEvent>> GetByIds(List<long> eventIds);

    Task Delete(UniversityEvent universityEvent);

    Task SaveChanges();
}
