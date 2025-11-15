using System.Text;
using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Options;
using HacatonMax.University.Deadlines.Application.Services;
using HacatonMax.University.Deadlines.Domain;
using HacatonMax.University.Deadlines.Infrastructure;
using HacatonMax.University.Structure.Domain;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TimeWarp.Mediator;

namespace HacatonMax.University.Deadlines.Application.Commands.CreateDeadline;

public sealed record CreateDeadlineCommand(
    long GroupId,
    string Title,
    string DescriptionHtml,
    DateTimeOffset DueAt,
    string AccessScope,
    long? ScheduleEntryId) : IRequest<long>;

public sealed class CreateDeadlineCommandHandler : IRequestHandler<CreateDeadlineCommand, long>
{
    private readonly DeadlinesDbContext _deadlinesDbContext;
    private readonly StructureDbContext _structureDbContext;
    private readonly IUserContextService _userContextService;
    private readonly IUserRoleProvider _userRoleProvider;
    private readonly IOptions<TenantSettings> _tenantSettings;
    private readonly IDeadlineNotificationService _notificationService;
    private readonly ILogger<CreateDeadlineCommandHandler> _logger;

    private const int MaxDescriptionSizeBytes = 20 * 1024;

    public CreateDeadlineCommandHandler(
        DeadlinesDbContext deadlinesDbContext,
        StructureDbContext structureDbContext,
        IUserContextService userContextService,
        IUserRoleProvider userRoleProvider,
        IOptions<TenantSettings> tenantSettings,
        IDeadlineNotificationService notificationService,
        ILogger<CreateDeadlineCommandHandler> logger)
    {
        _deadlinesDbContext = deadlinesDbContext;
        _structureDbContext = structureDbContext;
        _userContextService = userContextService;
        _userRoleProvider = userRoleProvider;
        _tenantSettings = tenantSettings;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<long> Handle(CreateDeadlineCommand request, CancellationToken cancellationToken)
    {
        ValidateDescriptionSize(request.DescriptionHtml);

        var group = await _structureDbContext.Groups
            .Include(x => x.CustomMeta)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.GroupId, cancellationToken);

        if (group is null)
        {
            throw new InvalidOperationException($"Group {request.GroupId} was not found");
        }

        var currentUser = _userContextService.GetCurrentUser();
        var accessScope = ParseAccessScope(request.AccessScope);
        await EnsureUserCanCreate(group, currentUser.Id, cancellationToken);

        var deadline = new Deadline(
            _tenantSettings.Value.TenantId,
            group.Id,
            request.Title,
            request.DescriptionHtml,
            request.DueAt,
            currentUser.Id,
            accessScope,
            request.ScheduleEntryId);

        await _deadlinesDbContext.Deadlines.AddAsync(deadline, cancellationToken);
        await _deadlinesDbContext.SaveChangesAsync(cancellationToken);
        await _notificationService.HandleDeadlineCreated(deadline, currentUser.Id, cancellationToken);

        _logger.LogInformation("Deadline {DeadlineId} created by {UserId} for group {GroupId}", deadline.Id, currentUser.Id, group.Id);
        return deadline.Id;
    }

    private static void ValidateDescriptionSize(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException("Description must not be empty");
        }

        var size = Encoding.UTF8.GetByteCount(description);
        if (size > MaxDescriptionSizeBytes)
        {
            throw new InvalidOperationException("Description exceeds 20KB limit");
        }
    }

    private static DeadlineAccessScope ParseAccessScope(string value)
    {
        if (Enum.TryParse<DeadlineAccessScope>(value, true, out var scope))
        {
            return scope;
        }

        throw new ArgumentException($"Access scope {value} is not supported");
    }

    private async Task EnsureUserCanCreate(Group group, long userId, CancellationToken cancellationToken)
    {
        if (group.Type == GroupType.CustomUser)
        {
            var isMember = await _structureDbContext.GroupMembers
                .AsNoTracking()
                .AnyAsync(member => member.GroupId == group.Id && member.StudentId == userId, cancellationToken);

            if (!isMember)
            {
                throw new InvalidOperationException("Only group members can create deadlines in custom groups.");
            }

            return;
        }

        var role = await _userRoleProvider.GetUserRole(userId, cancellationToken);
        if (role is UniversityUserRole.Admin or UniversityUserRole.Teacher)
        {
            return;
        }

        throw new InvalidOperationException("Only teachers or administrators can create deadlines in academic groups.");
    }
}


