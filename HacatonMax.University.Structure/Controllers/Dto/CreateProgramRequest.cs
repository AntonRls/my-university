using System.ComponentModel.DataAnnotations;

namespace HacatonMax.University.Structure.Controllers.Dto;

public sealed class CreateProgramRequest
{
    [Required]
    [MaxLength(256)]
    public string Name { get; init; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string DegreeLevel { get; init; } = string.Empty;
}
