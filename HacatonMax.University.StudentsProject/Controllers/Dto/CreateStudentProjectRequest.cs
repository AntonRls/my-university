using System;
using System.Collections.Generic;

namespace HacatonMax.University.StudentsProject.Controllers.Dto;

public class CreateStudentProjectRequest
{
    public string Title { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public List<SkillDto>? NeedSkills { get; init; }

    public long? EventId { get; init; }
}

