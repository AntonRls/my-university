namespace HacatonMax.University.Users.Controllers.Dto;

public record SimpleUserDto(
    long Id,
    string FirstName,
    string LastName,
    string? Username,
    string? Email,
    List<long> UniversityIds);

public record UserUniversityDto(
    long UniversityId,
    DateTimeOffset JoinedAt);

