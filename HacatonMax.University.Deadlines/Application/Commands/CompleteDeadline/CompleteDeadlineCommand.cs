using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Options;
using HacatonMax.University.Deadlines.Domain;
using HacatonMax.University.Deadlines.Infrastructure;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TimeWarp.Mediator;

namespace HacatonMax.University.Deadlines.Application.Commands.CompleteDeadline;

public sealed record CompleteDeadlineCommand(long DeadlineId) : IRequest;

public sealed class CompleteDeadlineCommandHandler : IRequestHandler<CompleteDeadlineCommand>
{
    private readonly DeadlinesDbContext _deadlinesDbContext;
    private readonly StructureDbContext _structureDbContext;
    private readonly IUserContextService _userContextService;
    private readonly IOptions<TenantSettings> _tenantSettings;

    public CompleteDeadlineCommandHandler(
        DeadlinesDbContext deadlinesDbContext,
        StructureDbContext structureDbContext,
        IUserContextService userContextService,
        IOptions<TenantSettings> tenantSettings)
    {
        _deadlinesDbContext = deadlinesDbContext;
        _structureDbContext = structureDbContext;
        _userContextService = userContextService;
        _tenantSettings = tenantSettings;
    }

    public async Task Handle(CompleteDeadlineCommand request, CancellationToken cancellationToken)
    {
        var deadline = await _deadlinesDbContext.Deadlines
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.DeadlineId, cancellationToken);

        if (deadline is null)
        {
            throw new InvalidOperationException($"Deadline {request.DeadlineId} not found");
        }

        var currentUser = _userContextService.GetCurrentUser();

        var isMember = await _structureDbContext.GroupMembers
            .AsNoTracking()
            .AnyAsync(member => member.GroupId == deadline.GroupId && member.StudentId == currentUser.Id, cancellationToken);

        if (!isMember)
        {
            throw new InvalidOperationException("Only group members can complete deadlines.");
        }

        var alreadyCompleted = await _deadlinesDbContext.DeadlineCompletions
            .AnyAsync(x => x.DeadlineId == deadline.Id && x.UserId == currentUser.Id, cancellationToken);

        if (alreadyCompleted)
        {
            return;
        }

        var completion = new DeadlineCompletion(deadline.Id, currentUser.Id, _tenantSettings.Value.TenantId);
        await _deadlinesDbContext.DeadlineCompletions.AddAsync(completion, cancellationToken);
        await _deadlinesDbContext.SaveChangesAsync(cancellationToken);

        return;
    }
}


