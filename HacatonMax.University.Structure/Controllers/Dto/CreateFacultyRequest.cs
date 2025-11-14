using System.ComponentModel.DataAnnotations;

namespace HacatonMax.University.Structure.Controllers.Dto;

public sealed class CreateFacultyRequest
{
    [Required]
    [MaxLength(256)]
    public string Name { get; init; } = string.Empty;

    [Required]
    [MaxLength(32)]
    public string Code { get; init; } = string.Empty;
}
