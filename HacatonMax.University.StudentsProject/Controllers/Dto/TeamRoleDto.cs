using System;

namespace HacatonMax.University.StudentsProject.Controllers.Dto;

public record TeamRoleDto(
    Guid Id,
    string Name,
    string? Description);

