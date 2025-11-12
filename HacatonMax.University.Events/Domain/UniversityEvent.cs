namespace HacatonMax.University.Events.Domain;

public class UniversityEvent
{
    public UniversityEvent(
        string title,
        string description,
        long creatorId,
        DateTimeOffset startDateTime,
        DateTimeOffset endDateTime,
        long? participantsLimit,
        List<Tag> tags)
    {
        Title = title;
        Description = description;
        CreatorId = creatorId;
        StartDateTime = startDateTime;
        EndDateTime = endDateTime;
        ParticipantsLimit = participantsLimit;
        Tags = tags;
    }

    public long Id { get; private set; }

    public string Title { get; private set; } = null!;

    public string Description { get; private set; } = null!;

    public long CreatorId { get; private set; }

    public DateTimeOffset StartDateTime { get; private set; }

    public DateTimeOffset EndDateTime { get; private set; }

    public long? ParticipantsLimit { get; private set; }

    public List<Tag> Tags { get; private set; } = new();

    public void Update(
        string title,
        string description,
        DateTimeOffset startDateTime,
        DateTimeOffset endDateTime,
        long? participantsLimit,
        List<Tag> tags)
    {
        Title = title;
        Description = description;
        StartDateTime = startDateTime;
        EndDateTime = endDateTime;
        ParticipantsLimit = participantsLimit;
        Tags = tags;
    }

    private UniversityEvent()
    {
        Tags = new List<Tag>();
    }
}
