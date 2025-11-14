using System.ComponentModel.DataAnnotations;

namespace HacatonMax.University.Structure.Controllers.Dto;

public sealed class CreateProgramCourseRequest
{
    [Range(1, 6)]
    public int CourseNumber { get; init; }

    [Required]
    [MaxLength(256)]
    public string Title { get; init; } = string.Empty;

    [Range(0, 60)]
    public int? Ects { get; init; }
}
