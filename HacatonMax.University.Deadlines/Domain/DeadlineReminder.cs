namespace HacatonMax.University.Deadlines.Domain;

public class DeadlineReminder
{
    private DeadlineReminder()
    {
    }

    public DeadlineReminder(long deadlineId, DeadlineReminderOffset offset)
    {
        DeadlineId = deadlineId;
        Offset = offset;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public long Id { get; private set; }

    public long DeadlineId { get; private set; }

    public DeadlineReminderOffset Offset { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset? SentAt { get; private set; }

    public Deadline Deadline { get; private set; } = null!;

    public void MarkSent()
    {
        SentAt = DateTimeOffset.UtcNow;
    }
}


