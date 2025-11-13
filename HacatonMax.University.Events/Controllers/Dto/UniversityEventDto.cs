namespace HacatonMax.University.Events.Controllers.Dto;

public record UniversityEventDto(
    long Id,
    string Title,
    string Description,
    string Location,
    long CreatorId,
    DateTimeOffset StartDateTime,
    DateTimeOffset EndDateTime,
    long? ParticipantsLimit,
    int RegisteredParticipantsCount,
    bool IsCurrentUserRegistered,
    List<TagDto> Tags);
