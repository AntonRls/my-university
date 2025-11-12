using HacatonMax.Common.Exceptions;
using HacatonMax.University.Auth.Domain;
using HacatonMax.University.StudentsProject.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.RemoveStudentProjectParticipant;

public class RemoveStudentProjectParticipantHandler : IRequestHandler<RemoveStudentProjectParticipantCommand>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;
    private readonly IUserContextService _userContextService;

    public RemoveStudentProjectParticipantHandler(
        IStudentProjectsRepository studentProjectsRepository,
        IUserContextService userContextService)
    {
        _studentProjectsRepository = studentProjectsRepository;
        _userContextService = userContextService;
    }

    public async Task Handle(RemoveStudentProjectParticipantCommand request, CancellationToken cancellationToken)
    {
        var project = await _studentProjectsRepository.GetById(request.ProjectId);
        if (project == null)
        {
            throw new NotFoundException($"Проект с идентификатором {request.ProjectId} не найден.");
        }

        var participant = project.FindParticipant(request.ParticipantId);
        if (participant == null)
        {
            throw new NotFoundException($"Участник с идентификатором {request.ParticipantId} не найден.");
        }

        var currentUser = _userContextService.GetCurrentUser();
        if (project.CreatorId != currentUser.Id && participant.UserId != currentUser.Id)
        {
            throw new ForbiddenException("Вы не можете удалить участника этого проекта.");
        }

        project.RemoveParticipant(participant);
        await _studentProjectsRepository.SaveChanges();
    }
}

