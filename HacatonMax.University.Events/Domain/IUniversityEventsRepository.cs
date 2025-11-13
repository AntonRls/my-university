namespace HacatonMax.University.Events.Domain;

public interface IUniversityEventsRepository
{
    Task Save(UniversityEvent universityEvent);

    Task<List<UniversityEvent>> Get(List<Guid>? tags);

    Task<List<UniversityEvent>> Search(string query);

    Task<List<Tag>> GetTags();

    Task<List<Tag>> GetExistsTags(List<Guid> tagIds);

    Task SaveTags(List<Tag> tags);

    Task<UniversityEvent?> GetById(long eventId);

    Task<List<UniversityEvent>> GetByIds(List<long> eventIds);

    Task Delete(UniversityEvent universityEvent);

    Task SaveChanges();

    Task<int> GetRegistrationsCount(long eventId);

    Task<bool> HasUserRegistration(long eventId, long userId);

    Task AddRegistration(UniversityEventRegistration registration);

    Task<List<UniversityEventRegistration>> GetRegistrationsForEvent(long eventId);

    Task<UniversityEventRegistration?> GetUserRegistration(long eventId, long userId);

    Task RemoveRegistration(UniversityEventRegistration registration);
}
