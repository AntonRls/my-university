namespace HacatonMax.Common.Schedule;

public sealed record ScheduleEventSubscriptionPayload(
    long TenantId,
    long EventId,
    long UserId,
    string Title,
    string? Description,
    string? Teacher,
    string? PhysicalLocation,
    string? OnlineLink,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string DeliveryType);

