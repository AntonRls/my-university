using System;
using System.Collections.Generic;
using HacatonMax.University.StudentsProject.Application.Common;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.RequestStudentProjectParticipation;

public record RequestStudentProjectParticipationCommand(
    Guid ProjectId,
    List<Guid>? RoleIds,
    List<NewTeamRoleInput>? NewRoles) : IRequest;

