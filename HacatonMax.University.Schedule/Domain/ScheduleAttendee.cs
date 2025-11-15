namespace HacatonMax.University.Schedule.Domain;

public class ScheduleAttendee
{
    public ScheduleAttendee(long userId)
    {
        UserId = userId;
        AddedAt = DateTimeOffset.UtcNow;
    }

    public long Id { get; private set; }

    public long ScheduleEntryId { get; private set; }

    public long UserId { get; private set; }

    public DateTimeOffset AddedAt { get; private set; }

    public ScheduleEntry ScheduleEntry { get; private set; } = null!;

    private ScheduleAttendee()
    {
    }
}

