namespace HacatonMax.University.Schedule.Controllers.Dto;

public sealed record ScheduleEntryDto(
    long Id,
    string Title,
    string? Description,
    string? Teacher,
    string? PhysicalLocation,
    string? OnlineLink,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string DeliveryType,
    long? GroupId,
    long? OwnerUserId,
    bool IsPersonal,
    ScheduleSourceDto Source);

