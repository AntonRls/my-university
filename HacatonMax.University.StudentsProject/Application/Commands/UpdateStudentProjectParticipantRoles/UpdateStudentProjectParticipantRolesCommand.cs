using System;
using System.Collections.Generic;
using HacatonMax.University.StudentsProject.Application.Common;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.UpdateStudentProjectParticipantRoles;

public record UpdateStudentProjectParticipantRolesCommand(
    Guid ProjectId,
    Guid ParticipantId,
    List<Guid> RoleIds,
    List<NewTeamRoleInput>? NewRoles) : IRequest;

