namespace HacatonMax.University.Schedule.Controllers.Dto;

public sealed record ScheduleFiltersDto(DateTimeOffset? From, DateTimeOffset? To, string? DeliveryType);

