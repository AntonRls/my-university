using HacatonMax.University.StudentsProject.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.CreateStudentProjects;

public record CreateStudentProjectsCommand(string Title, string Description, List<SkillDto> NeedSkills) : IRequest<StudentProjectsDto>;
