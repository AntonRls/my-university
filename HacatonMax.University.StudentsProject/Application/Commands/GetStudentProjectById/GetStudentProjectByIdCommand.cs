using HacatonMax.University.StudentsProject.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjectById;

public record GetStudentProjectByIdCommand(Guid ProjectId) : IRequest<StudentProjectsDto>;

