using System;
using System.Collections.Generic;

namespace HacatonMax.University.StudentsProject.Controllers.Dto;

public class ApproveStudentProjectParticipantRequest
{
    public List<Guid>? RoleIds { get; init; }

    public List<CreateTeamRoleRequest>? NewRoles { get; init; }
}

