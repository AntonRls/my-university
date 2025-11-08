namespace HacatonMax.University.Events.Domain;

public interface IUniversityEventsRepository
{
    Task Save(UniversityEvent universityEvent);

    Task<List<UniversityEvent>> Get(List<Guid>? tags);

    Task<List<Tag>> GetTags();
}
