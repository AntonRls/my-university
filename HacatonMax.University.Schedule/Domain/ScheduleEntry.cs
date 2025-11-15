namespace HacatonMax.University.Schedule.Domain;

public class ScheduleEntry
{
    public ScheduleEntry(
        long tenantId,
        string title,
        string? description,
        string? teacher,
        string? physicalLocation,
        string? onlineLink,
        DateTimeOffset startsAt,
        DateTimeOffset endsAt,
        ScheduleDeliveryType deliveryType,
        ScheduleSource sourceType,
        long createdByUserId,
        long? groupId = null,
        long? ownerUserId = null,
        long? sourceEntityId = null)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Title is required", nameof(title));
        }

        if (endsAt <= startsAt)
        {
            throw new ArgumentException("End time must be after start time", nameof(endsAt));
        }

        if (deliveryType == ScheduleDeliveryType.Offline && string.IsNullOrWhiteSpace(physicalLocation))
        {
            throw new ArgumentException("Physical location is required for offline entries", nameof(physicalLocation));
        }

        if (deliveryType == ScheduleDeliveryType.Online && string.IsNullOrWhiteSpace(onlineLink))
        {
            throw new ArgumentException("Online link is required for online entries", nameof(onlineLink));
        }

        TenantId = tenantId;
        Title = title;
        Description = description;
        Teacher = teacher;
        PhysicalLocation = physicalLocation;
        OnlineLink = onlineLink;
        StartsAt = startsAt;
        EndsAt = endsAt;
        DeliveryType = deliveryType;
        SourceType = sourceType;
        CreatedByUserId = createdByUserId;
        GroupId = groupId;
        OwnerUserId = ownerUserId;
        SourceEntityId = sourceEntityId;
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = CreatedAt;
    }

    public long Id { get; private set; }

    public long TenantId { get; private set; }

    public long? GroupId { get; private set; }

    public long? OwnerUserId { get; private set; }

    public long? SourceEntityId { get; private set; }

    public ScheduleSource SourceType { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public string? Description { get; private set; }

    public string? Teacher { get; private set; }

    public string? PhysicalLocation { get; private set; }

    public string? OnlineLink { get; private set; }

    public DateTimeOffset StartsAt { get; private set; }

    public DateTimeOffset EndsAt { get; private set; }

    public ScheduleDeliveryType DeliveryType { get; private set; }

    public long CreatedByUserId { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public ICollection<ScheduleAttendee> Attendees { get; private set; } = new List<ScheduleAttendee>();

    public void UpdateDetails(
        string title,
        string? description,
        string? teacher,
        string? physicalLocation,
        string? onlineLink,
        DateTimeOffset startsAt,
        DateTimeOffset endsAt,
        ScheduleDeliveryType deliveryType)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Title is required", nameof(title));
        }

        if (endsAt <= startsAt)
        {
            throw new ArgumentException("End time must be after start time", nameof(endsAt));
        }

        if (deliveryType == ScheduleDeliveryType.Offline && string.IsNullOrWhiteSpace(physicalLocation))
        {
            throw new ArgumentException("Physical location is required for offline entries", nameof(physicalLocation));
        }

        if (deliveryType == ScheduleDeliveryType.Online && string.IsNullOrWhiteSpace(onlineLink))
        {
            throw new ArgumentException("Online link is required for online entries", nameof(onlineLink));
        }

        Title = title;
        Description = description;
        Teacher = teacher;
        PhysicalLocation = physicalLocation;
        OnlineLink = onlineLink;
        StartsAt = startsAt;
        EndsAt = endsAt;
        DeliveryType = deliveryType;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpdateSourceMetadata(string title, string? description, string? teacher, string? physicalLocation, string? onlineLink, DateTimeOffset startsAt, DateTimeOffset endsAt, ScheduleDeliveryType deliveryType)
    {
        UpdateDetails(title, description, teacher, physicalLocation, onlineLink, startsAt, endsAt, deliveryType);
    }

    public void AssignOwner(long ownerUserId)
    {
        OwnerUserId = ownerUserId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    private ScheduleEntry()
    {
    }
}

