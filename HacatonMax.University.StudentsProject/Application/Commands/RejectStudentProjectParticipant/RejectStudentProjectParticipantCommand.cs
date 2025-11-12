using System;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.RejectStudentProjectParticipant;

public record RejectStudentProjectParticipantCommand(
    Guid ProjectId,
    Guid ParticipantId) : IRequest;

