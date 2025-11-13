namespace HacatonMax.University.Events.Domain;

public class UniversityEvent
{
    public UniversityEvent(
        string title,
        string description,
        string location,
        long creatorId,
        DateTimeOffset startDateTime,
        DateTimeOffset endDateTime,
        long? participantsLimit,
        List<Tag> tags)
    {
        Title = title;
        Description = description;
        Location = location;
        CreatorId = creatorId;
        StartDateTime = startDateTime;
        EndDateTime = endDateTime;
        ParticipantsLimit = participantsLimit;
        Tags = tags;
    }

    public long Id { get; private set; }

    public string Title { get; private set; } = null!;

    public string Description { get; private set; } = null!;

    public string Location { get; private set; } = null!;

    public long CreatorId { get; private set; }

    public DateTimeOffset StartDateTime { get; private set; }

    public DateTimeOffset EndDateTime { get; private set; }

    public long? ParticipantsLimit { get; private set; }

    public List<Tag> Tags { get; private set; } = new();

    public List<UniversityEventRegistration> Registrations { get; private set; } = new();

    public void Update(
        string title,
        string description,
        string location,
        DateTimeOffset startDateTime,
        DateTimeOffset endDateTime,
        long? participantsLimit,
        List<Tag> tags)
    {
        Title = title;
        Description = description;
        Location = location;
        StartDateTime = startDateTime;
        EndDateTime = endDateTime;
        ParticipantsLimit = participantsLimit;
        Tags = tags;
    }

    public bool CanRegister(int currentRegistrations)
    {
        if (!ParticipantsLimit.HasValue)
        {
            return true;
        }

        return currentRegistrations < ParticipantsLimit.Value;
    }

    private UniversityEvent()
    {
        Tags = new List<Tag>();
        Registrations = new List<UniversityEventRegistration>();
    }
}
