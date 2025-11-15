namespace HacatonMax.University.Deadlines.Domain;

public class DeadlineCompletion
{
    private DeadlineCompletion()
    {
    }

    public DeadlineCompletion(long deadlineId, long userId, long tenantId)
    {
        DeadlineId = deadlineId;
        UserId = userId;
        TenantId = tenantId;
        CompletedAt = DateTimeOffset.UtcNow;
    }

    public long Id { get; private set; }

    public long DeadlineId { get; private set; }

    public long UserId { get; private set; }

    public long TenantId { get; private set; }

    public DateTimeOffset CompletedAt { get; private set; }

    public Deadline Deadline { get; private set; } = null!;
}


