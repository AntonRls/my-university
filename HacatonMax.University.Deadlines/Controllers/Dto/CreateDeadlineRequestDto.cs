namespace HacatonMax.University.Deadlines.Controllers.Dto;

public sealed record CreateDeadlineRequestDto(
    string Title,
    string DescriptionHtml,
    DateTimeOffset DueAt,
    string AccessScope,
    long? ScheduleEntryId);


