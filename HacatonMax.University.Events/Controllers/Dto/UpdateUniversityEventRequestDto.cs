namespace HacatonMax.University.Events.Controllers.Dto;

public record UpdateUniversityEventRequestDto(
    string Title,
    string Description,
    string Location,
    long? ParticipantsLimit,
    DateTimeOffset StartDateTime,
    DateTimeOffset EndDateTime,
    List<TagDto> Tags);

