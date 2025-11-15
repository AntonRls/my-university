namespace HacatonMax.University.Events.Controllers.Dto;

public record EventRegistrationDto(
    long Id,
    long UserId,
    string UserFirstName,
    string UserLastName,
    string? UserUsername,
    DateTimeOffset CreatedAt);

