namespace HacatonMax.University.Schedule.Controllers.Dto;

public sealed record PersonalSlotRequestDto(
    string Title,
    string? Description,
    string? Teacher,
    string DeliveryType,
    string? PhysicalLocation,
    string? OnlineLink,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt);

