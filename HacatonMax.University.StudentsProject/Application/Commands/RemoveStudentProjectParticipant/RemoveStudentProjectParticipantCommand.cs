using System;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.RemoveStudentProjectParticipant;

public record RemoveStudentProjectParticipantCommand(
    Guid ProjectId,
    Guid ParticipantId) : IRequest;

