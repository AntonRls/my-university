using System;
using System.Collections.Generic;

namespace HacatonMax.University.StudentsProject.Controllers.Dto;

public class UpdateParticipantRolesRequest
{
    public List<Guid> RoleIds { get; init; } = new();

    public List<CreateTeamRoleRequest>? NewRoles { get; init; }
}

