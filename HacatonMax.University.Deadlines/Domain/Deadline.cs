namespace HacatonMax.University.Deadlines.Domain;

public class Deadline
{
    private Deadline()
    {
        Title = string.Empty;
        DescriptionHtml = string.Empty;
        Completions = new List<DeadlineCompletion>();
        Reminders = new List<DeadlineReminder>();
    }

    public Deadline(
        long tenantId,
        long groupId,
        string title,
        string descriptionHtml,
        DateTimeOffset dueAt,
        long creatorUserId,
        DeadlineAccessScope accessScope,
        long? scheduleEntryId = null)
        : this()
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(descriptionHtml);

        TenantId = tenantId;
        GroupId = groupId;
        Title = title.Trim();
        DescriptionHtml = descriptionHtml;
        DueAt = dueAt;
        CreatorUserId = creatorUserId;
        LastEditorUserId = creatorUserId;
        AccessScope = accessScope;
        ScheduleEntryId = scheduleEntryId;
        Status = DeadlineStatus.Active;
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = CreatedAt;
    }

    public long Id { get; private set; }

    public long TenantId { get; private set; }

    public long GroupId { get; private set; }

    public string Title { get; private set; }

    public string DescriptionHtml { get; private set; }

    public DateTimeOffset DueAt { get; private set; }

    public long? ScheduleEntryId { get; private set; }

    public long CreatorUserId { get; private set; }

    public long LastEditorUserId { get; private set; }

    public DeadlineStatus Status { get; private set; }

    public DeadlineAccessScope AccessScope { get; private set; }

    public DateTimeOffset? CompletedAt { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public DateTimeOffset? DeletedAt { get; private set; }

    public DateTimeOffset? LastNotificationAt { get; private set; }

    public ICollection<DeadlineCompletion> Completions { get; private set; }

    public ICollection<DeadlineReminder> Reminders { get; private set; }

    public void Update(
        string title,
        string descriptionHtml,
        DateTimeOffset dueAt,
        long editorUserId,
        DeadlineAccessScope accessScope,
        long? scheduleEntryId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(descriptionHtml);

        Title = title.Trim();
        DescriptionHtml = descriptionHtml;
        DueAt = dueAt;
        LastEditorUserId = editorUserId;
        AccessScope = accessScope;
        ScheduleEntryId = scheduleEntryId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Complete(long editorUserId)
    {
        if (Status == DeadlineStatus.Cancelled)
        {
            throw new InvalidOperationException("Cancelled deadlines cannot be completed.");
        }

        Status = DeadlineStatus.Completed;
        CompletedAt = DateTimeOffset.UtcNow;
        LastEditorUserId = editorUserId;
        UpdatedAt = CompletedAt.Value;
    }

    public void Reopen(long editorUserId)
    {
        Status = DeadlineStatus.Active;
        CompletedAt = null;
        LastEditorUserId = editorUserId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Cancel(long editorUserId)
    {
        Status = DeadlineStatus.Cancelled;
        LastEditorUserId = editorUserId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Delete()
    {
        DeletedAt = DateTimeOffset.UtcNow;
    }

    public void TouchNotification()
    {
        LastNotificationAt = DateTimeOffset.UtcNow;
        UpdatedAt = LastNotificationAt.Value;
    }

    public void SyncWithSchedule(long scheduleEntryId, DateTimeOffset dueAt, long editorUserId)
    {
        ScheduleEntryId = scheduleEntryId;
        DueAt = dueAt;
        LastEditorUserId = editorUserId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}


