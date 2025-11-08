using HacatonMax.University.StudentsProject.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjects;

public record GetStudentProjectsCommand(List<Guid>? NeedSkills = null) : IRequest<List<StudentProjectsDto>>;
