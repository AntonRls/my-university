namespace HacatonMax.University.Events.Domain;

public class UniversityEvent
{
    public UniversityEvent(
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

    public long Id { get; private set; }

    public string Title { get; private set; }

    public string Description { get; private set; }

    public DateTimeOffset StartDateTime { get; private set; }

    public DateTimeOffset EndDateTime { get; private set; }

    public long? ParticipantsLimit { get; private set; }

    public List<Tag> Tags { get; private set; }

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
    }
}
