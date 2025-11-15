using HacatonMax.Bot.Domain;
using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.StudentsProject.Domain;
using Microsoft.Extensions.Logging;
using TimeWarp.Mediator;
using Message = HacatonMax.Bot.Domain.Message;

namespace HacatonMax.University.StudentsProject.Application.Commands.RejectStudentProjectParticipant;

public class RejectStudentProjectParticipantHandler : IRequestHandler<RejectStudentProjectParticipantCommand>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;
    private readonly IUserContextService _userContextService;
    private readonly IBotProvider _botProvider;
    private readonly ILogger<RejectStudentProjectParticipantHandler> _logger;

    public RejectStudentProjectParticipantHandler(
        IStudentProjectsRepository studentProjectsRepository,
        IUserContextService userContextService,
        IBotProvider botProvider,
        ILogger<RejectStudentProjectParticipantHandler> logger)
    {
        _studentProjectsRepository = studentProjectsRepository;
        _userContextService = userContextService;
        _botProvider = botProvider;
        _logger = logger;
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

        await SendNotificationAsync(participant.UserId, project.Title, cancellationToken);
    }

    private async Task SendNotificationAsync(long userId, string projectTitle, CancellationToken cancellationToken)
    {
        try
        {
            var message = $"Ваша заявка на участие в проекте \"{projectTitle}\" была отклонена.";
            await _botProvider.SendMessage(new Message
            {
                UserId = userId,
                Text = message
            });
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Failed to send rejection notification to user {UserId} for project \"{ProjectTitle}\"", userId, projectTitle);
        }
    }
}

