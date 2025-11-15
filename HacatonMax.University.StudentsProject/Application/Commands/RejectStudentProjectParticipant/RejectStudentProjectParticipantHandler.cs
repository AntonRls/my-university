using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.StudentsProject.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.RejectStudentProjectParticipant;

public class RejectStudentProjectParticipantHandler : IRequestHandler<RejectStudentProjectParticipantCommand>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;
    private readonly IUserContextService _userContextService;

    public RejectStudentProjectParticipantHandler(
        IStudentProjectsRepository studentProjectsRepository,
        IUserContextService userContextService)
    {
        _studentProjectsRepository = studentProjectsRepository;
        _userContextService = userContextService;
    }

    public async Task Handle(RejectStudentProjectParticipantCommand request, CancellationToken cancellationToken)
    {
        var project = await _studentProjectsRepository.GetById(request.ProjectId);
        if (project == null)
        {
            throw new NotFoundException($"Проект с идентификатором {request.ProjectId} не найден.");
        }

        var currentUser = _userContextService.GetCurrentUser();
        if (project.CreatorId != currentUser.Id)
        {
            throw new ForbiddenException("Только создатель проекта может отклонять участников.");
        }

        var participant = project.FindParticipant(request.ParticipantId);
        if (participant == null)
        {
            throw new NotFoundException($"Участник с идентификатором {request.ParticipantId} не найден.");
        }

        if (participant.IsCreator)
        {
            throw new BadRequestException("Нельзя отклонить создателя проекта.");
        }

        participant.UpdateStatus(StudentProjectParticipantStatus.Rejected);
        participant.SetParticipantRoles(new List<StudentProjectParticipantRole>());

        await _studentProjectsRepository.SaveChanges();
    }
}

