using HacatonMax.University.StudentsProject.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.CreateTeamRole;

public record CreateTeamRoleCommand(string Name, string? Description) : IRequest<TeamRoleDto>;

