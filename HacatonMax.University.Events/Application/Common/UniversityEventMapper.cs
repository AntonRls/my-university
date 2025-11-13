using System.Collections.Generic;
using System.Linq;
using HacatonMax.University.Events.Controllers.Dto;
using HacatonMax.University.Events.Domain;

namespace HacatonMax.University.Events.Application.Common;

internal static class UniversityEventMapper
{
    public static UniversityEventDto ToDto(UniversityEvent universityEvent, long currentUserId)
    {
        var registrations = universityEvent.Registrations;
        var registeredParticipantsCount = registrations.Count;
        var isCurrentUserRegistered = registrations.Any(registration => registration.UserId == currentUserId);

        return new UniversityEventDto(
            universityEvent.Id,
            universityEvent.Title,
            universityEvent.Description,
            universityEvent.Location,
            universityEvent.CreatorId,
            universityEvent.StartDateTime,
            universityEvent.EndDateTime,
            universityEvent.ParticipantsLimit,
            registeredParticipantsCount,
            isCurrentUserRegistered,
            universityEvent.Tags.Select(tag => new TagDto(tag.Id, tag.Name)).ToList());
    }

    public static List<UniversityEventDto> ToDtoList(IEnumerable<UniversityEvent> events, long currentUserId)
    {
        return events
            .Select(universityEvent => ToDto(universityEvent, currentUserId))
            .ToList();
    }
}

