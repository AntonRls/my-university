namespace HacatonMax.University.StudentsProject.Controllers.Dto;

public record StudentProjectEventDto(
    long Id,
    string Title,
    DateTimeOffset StartDateTime,
    DateTimeOffset EndDateTime);

