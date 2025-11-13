using System;
using System.Collections.Generic;
using HacatonMax.University.StudentsProject.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.UpdateStudentProject;

public record UpdateStudentProjectCommand(
    Guid ProjectId,
    string Title,
    string Description,
    List<SkillDto>? NeedSkills = null,
    long? EventId = null) : IRequest<StudentProjectsDto>;

