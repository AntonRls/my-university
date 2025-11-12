using System.Collections.Generic;
using System.Linq;
using HacatonMax.University.StudentsProject.Controllers.Dto;
using HacatonMax.University.StudentsProject.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.GetTeamRoles;

public class GetTeamRolesHandler : IRequestHandler<GetTeamRolesCommand, List<TeamRoleDto>>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;

    public GetTeamRolesHandler(IStudentProjectsRepository studentProjectsRepository)
    {
        _studentProjectsRepository = studentProjectsRepository;
    }

    public async Task<List<TeamRoleDto>> Handle(GetTeamRolesCommand request, CancellationToken cancellationToken)
    {
        var roles = await _studentProjectsRepository.GetAllTeamRoles();

        return roles
            .Select(role => new TeamRoleDto(role.Id, role.Name, role.Description))
            .OrderBy(role => role.Name)
            .ToList();
    }
}

