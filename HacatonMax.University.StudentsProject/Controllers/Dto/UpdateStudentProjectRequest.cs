using System.Collections.Generic;

namespace HacatonMax.University.StudentsProject.Controllers.Dto;

public class UpdateStudentProjectRequest
{
    public string Title { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public List<SkillDto> NeedSkills { get; init; } = new();

    public long? EventId { get; init; }
}

