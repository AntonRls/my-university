using System.Collections.Generic;
using HacatonMax.University.StudentsProject.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.GetTeamRoles;

public record GetTeamRolesCommand() : IRequest<List<TeamRoleDto>>;

