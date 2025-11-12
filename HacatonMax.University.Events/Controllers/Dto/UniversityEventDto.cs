namespace HacatonMax.University.Events.Controllers.Dto;

public record UniversityEventDto(
    long Id,
    string Title,
    string Description,
    long CreatorId,
    DateTimeOffset StartDateTime,
    DateTimeOffset EndDateTime,
    long? ParticipantsLimit,
    List<TagDto> Tags);
