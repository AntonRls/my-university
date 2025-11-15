using System.Linq;
using HacatonMax.University.Deadlines.Domain;

namespace HacatonMax.University.Deadlines.Application.Models;

public sealed record DeadlineDto(
    long Id,
    long GroupId,
    string Title,
    string DescriptionHtml,
    DateTimeOffset DueAt,
    string Status,
    string AccessScope,
    long? ScheduleEntryId,
    DateTimeOffset? CompletedAt,
    IReadOnlyCollection<DeadlineCompletionDto> Completions);

public sealed record DeadlineCompletionDto(long UserId, DateTimeOffset CompletedAt);

public static class DeadlineMapper
{
    public static DeadlineDto Map(Deadline deadline)
    {
        return new DeadlineDto(
            deadline.Id,
            deadline.GroupId,
            deadline.Title,
            deadline.DescriptionHtml,
            deadline.DueAt,
            deadline.Status.ToString(),
            deadline.AccessScope.ToString(),
            deadline.ScheduleEntryId,
            deadline.CompletedAt,
            deadline.Completions
                .Select(completion => new DeadlineCompletionDto(completion.UserId, completion.CompletedAt))
                .ToList());
    }
}


