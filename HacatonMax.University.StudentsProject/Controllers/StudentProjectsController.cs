using HacatonMax.University.StudentsProject.Application.Commands.CreateStudentProjects;
using HacatonMax.University.StudentsProject.Application.Commands.GetAllSkills;
using HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjects;
using HacatonMax.University.StudentsProject.Controllers.Dto;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Controllers;

[ApiController]
[Route("student-projects")]
public class StudentProjectsController(IMediator mediator)
{
    [HttpGet]
    public Task<List<StudentProjectsDto>> GetStudentProjects([FromQuery] GetStudentProjectsCommand command)
    {
        return mediator.Send(command);
    }

    [HttpPost]
    public Task<StudentProjectsDto> CrateStudentProject([FromBody] CreateStudentProjectsCommand command)
    {
        return mediator.Send(command);
    }

    [HttpGet("skills")]
    public Task<List<SkillDto>> GetAllSkills()
    {
        return mediator.Send(new GetAllSkillsCommand());
    }
}
