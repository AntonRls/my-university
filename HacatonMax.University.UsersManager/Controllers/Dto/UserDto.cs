using HacatonMax.University.Admin.Domain;

namespace HacatonMax.University.Admin.Controllers.Dto;

public record UserDto(long Id, string FirstName, string LastName, string? Username, UserRole Role, string UniversityName);
