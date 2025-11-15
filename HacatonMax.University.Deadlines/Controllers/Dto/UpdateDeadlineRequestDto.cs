namespace HacatonMax.University.Deadlines.Controllers.Dto;

public sealed record UpdateDeadlineRequestDto(
    string Title,
    string DescriptionHtml,
    DateTimeOffset DueAt,
    string AccessScope,
    long? ScheduleEntryId);


