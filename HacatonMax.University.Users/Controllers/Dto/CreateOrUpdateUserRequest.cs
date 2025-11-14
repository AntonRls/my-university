namespace HacatonMax.University.Users.Controllers.Dto;

public record CreateOrUpdateUserRequest(
    long Id,
    string FirstName,
    string LastName,
    string? Username = null,
    string? Email = null);

