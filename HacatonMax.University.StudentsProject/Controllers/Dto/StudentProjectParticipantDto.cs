using System;
using System.Collections.Generic;
using HacatonMax.University.StudentsProject.Domain;

namespace HacatonMax.University.StudentsProject.Controllers.Dto;

public record StudentProjectParticipantDto(
    Guid Id,
    long UserId,
    StudentProjectParticipantStatus Status,
    bool IsCreator,
    DateTimeOffset CreatedAt,
    List<TeamRoleDto> Roles);

