using HacatonMax.Bot.Domain;
using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.Admin.Domain;
using HacatonMax.University.StudentsProject.Application.Common;
using HacatonMax.University.StudentsProject.Domain;
using TimeWarp.Mediator;
using User = HacatonMax.Common.AuthHelper.User;

namespace HacatonMax.University.StudentsProject.Application.Commands.RequestStudentProjectParticipation;

public class RequestStudentProjectParticipationHandler : IRequestHandler<RequestStudentProjectParticipationCommand>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;
    private readonly IUserContextService _userContextService;
    private readonly IBotProvider _botProvider;

    public RequestStudentProjectParticipationHandler(
        IStudentProjectsRepository studentProjectsRepository,
        IUserContextService userContextService,
        IBotProvider botProvider)
    {
        _studentProjectsRepository = studentProjectsRepository;
        _userContextService = userContextService;
        _botProvider = botProvider;
    }

    public async Task Handle(RequestStudentProjectParticipationCommand request, CancellationToken cancellationToken)
    {
        var project = await _studentProjectsRepository.GetById(request.ProjectId);
        if (project == null)
        {
            throw new NotFoundException($"Проект с идентификатором {request.ProjectId} не найден.");
        }

        var currentUser = _userContextService.GetCurrentUser();

        var existingParticipant = project.FindParticipantByUser(currentUser.Id);
        
        // Проверяем, является ли пользователь создателем проекта
        if (project.CreatorId == currentUser.Id)
        {
            // Если создатель уже является участником (что должно быть всегда), 
            // то он не может подать заявку
            if (existingParticipant != null)
            {
                throw new BadRequestException("Создатель проекта уже состоит в команде.");
            }
            // Если создатель почему-то не является участником, это ошибка данных
            throw new BadRequestException("Создатель проекта должен быть участником команды.");
        }
        if (existingParticipant != null)
        {
            throw existingParticipant.Status switch
            {
                StudentProjectParticipantStatus.Approved => new BadRequestException("Вы уже участник команды."),
                StudentProjectParticipantStatus.Applied => new BadRequestException("Заявка уже отправлена и ожидает решения."),
                StudentProjectParticipantStatus.Rejected => new BadRequestException("Ваша заявка была отклонена. Свяжитесь с создателем команды."),
                _ => new BadRequestException("Вы уже взаимодействовали с этим проектом.")
            };
        }

        var participantId = Guid.NewGuid();
        var participant = new StudentProjectParticipant(
            participantId,
            project.Id,
            currentUser.Id,
            StudentProjectParticipantStatus.Applied,
            false,
            DateTimeOffset.UtcNow);

        var participantRoles = await ResolveParticipantRoles(
            participantId,
            request.RoleIds,
            request.NewRoles,
            cancellationToken);

        if (participantRoles.Count > 0)
        {
            participant.SetParticipantRoles(participantRoles);
        }

        // Explicitly add the participant to the context to ensure it's tracked as Added
        // This prevents EF Core from trying to UPDATE instead of INSERT
        // The foreign key relationship (StudentProjectId) will maintain the association
        await _studentProjectsRepository.AddParticipant(participant);

        await _studentProjectsRepository.SaveChanges();

        await NotifyProjectOwner(project, currentUser);
    }

    private async Task<List<StudentProjectParticipantRole>> ResolveParticipantRoles(
        Guid participantId,
        List<Guid>? roleIds,
        List<NewTeamRoleInput>? requestedNewRoles,
        CancellationToken cancellationToken)
    {
        var uniqueRoleIds = (roleIds ?? new List<Guid>())
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        var normalizedNewRoles = (requestedNewRoles ?? new List<NewTeamRoleInput>())
            .Where(role => !string.IsNullOrWhiteSpace(role.Name))
            .Select(role => new NewTeamRoleInput(role.Name.Trim(), string.IsNullOrWhiteSpace(role.Description) ? null : role.Description!.Trim()))
            .GroupBy(role => role.Name, StringComparer.OrdinalIgnoreCase)
            .Select(group => new NewTeamRoleInput(group.Key, group.First().Description))
            .ToList();

        if (uniqueRoleIds.Count + normalizedNewRoles.Count > 2)
        {
            throw new BadRequestException("Можно выбрать не более двух ролей.");
        }

        var resolvedRoles = new List<TeamRole>();

        if (uniqueRoleIds.Count > 0)
        {
            var rolesByIds = await _studentProjectsRepository.GetTeamRolesByIds(uniqueRoleIds);
            if (rolesByIds.Count != uniqueRoleIds.Count)
            {
                throw new NotFoundException("Выбрана несуществующая роль.");
            }

            resolvedRoles.AddRange(rolesByIds);
        }

        if (normalizedNewRoles.Count > 0)
        {
            var names = normalizedNewRoles.Select(role => role.Name);
            var existingRoles = await _studentProjectsRepository.GetTeamRolesByNames(names);
            resolvedRoles.AddRange(existingRoles);

            var existingNames = existingRoles
                .Select(role => role.Name)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var rolesToCreate = normalizedNewRoles
                .Where(role => !existingNames.Contains(role.Name))
                .Select(role => new TeamRole(Guid.NewGuid(), role.Name, role.Description))
                .ToList();

            if (rolesToCreate.Count > 0)
            {
                await _studentProjectsRepository.AddTeamRoles(rolesToCreate);
                resolvedRoles.AddRange(rolesToCreate);
            }
        }

        return resolvedRoles
            .Select(role => new StudentProjectParticipantRole(Guid.NewGuid(), participantId, role.Id))
            .ToList();
    }

    private Task NotifyProjectOwner(StudentProject project, User applicant)
    {
        if (project.CreatorId == applicant.Id)
        {
            return Task.CompletedTask;
        }

        var notificationText = BuildOwnerNotificationMessage(project, applicant);

        return _botProvider.SendMessage(new Message
        {
            UserId = project.CreatorId,
            Text = notificationText
        });
    }

    private static string BuildOwnerNotificationMessage(StudentProject project, User applicant)
    {
        var nameParts = new[]
        {
            applicant.FirstName,
            applicant.LastName
        }.Where(part => !string.IsNullOrWhiteSpace(part));

        var displayName = string.Join(" ", nameParts);
        if (string.IsNullOrWhiteSpace(displayName))
        {
            displayName = "Новый участник";
        }

        var usernameSegment = string.IsNullOrWhiteSpace(applicant.Username)
            ? string.Empty
            : $" (@{applicant.Username})";

        return $"{displayName}{usernameSegment} отправил(а) заявку на участие в проекте \"{project.Title}\".";
    }
}

