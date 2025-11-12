using System.ComponentModel.DataAnnotations;

namespace HacatonMax.University.StudentsProject.Controllers.Dto;

public class CreateTeamRoleRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; init; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; init; }
}

