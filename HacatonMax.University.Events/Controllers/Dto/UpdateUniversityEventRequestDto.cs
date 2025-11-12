namespace HacatonMax.University.Events.Controllers.Dto;

public record UpdateUniversityEventRequestDto(
    string Title,
    string Description,
    long? ParticipantsLimit,
    DateTimeOffset StartDateTime,
    DateTimeOffset EndDateTime,
    List<TagDto> Tags);

