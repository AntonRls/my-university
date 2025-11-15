using HacatonMax.Common.AuthHelper;
using HacatonMax.University.Deadlines.Application.Services;
using HacatonMax.University.Deadlines.Domain;
using HacatonMax.University.Deadlines.Infrastructure;
using HacatonMax.University.Structure.Domain;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TimeWarp.Mediator;

namespace HacatonMax.University.Deadlines.Application.Commands.UpdateDeadline;

public sealed record UpdateDeadlineCommand(
    long DeadlineId,
    string Title,
    string DescriptionHtml,
    DateTimeOffset DueAt,
    string AccessScope,
    long? ScheduleEntryId) : IRequest;

public sealed class UpdateDeadlineCommandHandler : IRequestHandler<UpdateDeadlineCommand>
{
    private readonly DeadlinesDbContext _deadlinesDbContext;
    private readonly StructureDbContext _structureDbContext;
    private readonly IUserContextService _userContextService;
    private readonly IUserRoleProvider _userRoleProvider;
    private readonly IDeadlineNotificationService _notificationService;
    private readonly ILogger<UpdateDeadlineCommandHandler> _logger;

    public UpdateDeadlineCommandHandler(
        DeadlinesDbContext deadlinesDbContext,
        StructureDbContext structureDbContext,
        IUserContextService userContextService,
        IUserRoleProvider userRoleProvider,
        IDeadlineNotificationService notificationService,
        ILogger<UpdateDeadlineCommandHandler> logger)
    {
        _deadlinesDbContext = deadlinesDbContext;
        _structureDbContext = structureDbContext;
        _userContextService = userContextService;
        _userRoleProvider = userRoleProvider;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Handle(UpdateDeadlineCommand request, CancellationToken cancellationToken)
    {
        var deadline = await _deadlinesDbContext.Deadlines
            .FirstOrDefaultAsync(x => x.Id == request.DeadlineId, cancellationToken);

        if (deadline is null)
        {
            throw new InvalidOperationException($"Deadline {request.DeadlineId} not found");
        }

        var group = await _structureDbContext.Groups
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == deadline.GroupId, cancellationToken);

        if (group is null)
        {
            throw new InvalidOperationException($"Group {deadline.GroupId} not found");
        }

        var currentUser = _userContextService.GetCurrentUser();
        await EnsureUserCanEdit(group, currentUser.Id, cancellationToken);

        var accessScope = Enum.Parse<DeadlineAccessScope>(request.AccessScope, true);
        deadline.Update(request.Title, request.DescriptionHtml, request.DueAt, currentUser.Id, accessScope, request.ScheduleEntryId);

        await _deadlinesDbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Deadline {DeadlineId} updated by {UserId}", deadline.Id, currentUser.Id);
        await _notificationService.HandleDeadlineUpdated(deadline, currentUser.Id, cancellationToken);

        return;
    }

    private async Task EnsureUserCanEdit(Group group, long userId, CancellationToken cancellationToken)
    {
        if (group.Type == GroupType.CustomUser)
        {
            var isMember = await _structureDbContext.GroupMembers
                .AsNoTracking()
                .AnyAsync(member => member.GroupId == group.Id && member.StudentId == userId, cancellationToken);

            if (!isMember)
            {
                throw new InvalidOperationException("Only group members can edit deadlines in custom groups.");
            }

            return;
        }

        var role = await _userRoleProvider.GetUserRole(userId, cancellationToken);
        if (role is UniversityUserRole.Admin or UniversityUserRole.Teacher)
        {
            return;
        }

        throw new InvalidOperationException("Only teachers or administrators can edit deadlines in academic groups.");
    }
}


