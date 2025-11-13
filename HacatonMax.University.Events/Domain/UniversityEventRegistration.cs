namespace HacatonMax.University.Events.Domain;

public class UniversityEventRegistration
{
    public UniversityEventRegistration(long universityEventId, long userId, DateTimeOffset createdAt)
    {
        UniversityEventId = universityEventId;
        UserId = userId;
        CreatedAt = createdAt;
    }

    public long Id { get; private set; }

    public long UniversityEventId { get; private set; }

    public long UserId { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public UniversityEvent UniversityEvent { get; private set; } = null!;

    private UniversityEventRegistration()
    {
    }
}

