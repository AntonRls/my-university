using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.StudentsProject.Application.Common;
using HacatonMax.University.StudentsProject.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.ApproveStudentProjectParticipant;

public class ApproveStudentProjectParticipantHandler : IRequestHandler<ApproveStudentProjectParticipantCommand>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;
    private readonly IUserContextService _userContextService;

    public ApproveStudentProjectParticipantHandler(
        IStudentProjectsRepository studentProjectsRepository,
        IUserContextService userContextService)
    {
        _studentProjectsRepository = studentProjectsRepository;
        _userContextService = userContextService;
    }

    public async Task Handle(ApproveStudentProjectParticipantCommand request, CancellationToken cancellationToken)
    {
        var project = await _studentProjectsRepository.GetById(request.ProjectId);
        if (project == null)
        {
            throw new NotFoundException($"Проект с идентификатором {request.ProjectId} не найден.");
        }

        var currentUser = _userContextService.GetCurrentUser();
        if (project.CreatorId != currentUser.Id)
        {
            throw new ForbiddenException("Только создатель проекта может подтверждать участников.");
        }

        var participant = project.FindParticipant(request.ParticipantId);
        if (participant == null)
        {
            throw new NotFoundException($"Участник с идентификатором {request.ParticipantId} не найден.");
        }

        if (participant.IsCreator)
        {
            throw new BadRequestException("Нельзя изменять статус создателя.");
        }

        if (participant.Status == StudentProjectParticipantStatus.Approved)
        {
            throw new BadRequestException("Участник уже подтверждён.");
        }

        if (participant.Status == StudentProjectParticipantStatus.Rejected)
        {
            throw new BadRequestException("Участник был отклонён. Попросите его отправить запрос повторно.");
        }

        var participantRoles = await ResolveParticipantRoles(
            participant.Id,
            request.RoleIds,
            request.NewRoles,
            cancellationToken);

        participant.UpdateStatus(StudentProjectParticipantStatus.Approved);
        participant.SetParticipantRoles(participantRoles);

        await _studentProjectsRepository.SaveChanges();
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
}

