using HacatonMax.University.Schedule.Controllers.Dto;
using HacatonMax.University.Schedule.Domain;

namespace HacatonMax.University.Schedule.Application.Common;

public static class ScheduleEntryMapper
{
    public static ScheduleEntryDto ToDto(ScheduleEntry entry, long currentUserId)
    {
        var isPersonal = entry.OwnerUserId == currentUserId ||
                         entry.SourceType == ScheduleSource.ManualPersonal ||
                         entry.Attendees.Any(attendee => attendee.UserId == currentUserId);

        return new ScheduleEntryDto(
            entry.Id,
            entry.Title,
            entry.Description,
            entry.Teacher,
            entry.PhysicalLocation,
            entry.OnlineLink,
            entry.StartsAt,
            entry.EndsAt,
            entry.DeliveryType.ToString(),
            entry.GroupId,
            entry.OwnerUserId,
            isPersonal,
            new ScheduleSourceDto(entry.SourceType.ToString(), entry.SourceEntityId));
    }

    public static List<ScheduleEntryDto> ToDtoList(IEnumerable<ScheduleEntry> entries, long currentUserId)
    {
        return entries
            .OrderBy(x => x.StartsAt)
            .Select(entry => ToDto(entry, currentUserId))
            .ToList();
    }
}

