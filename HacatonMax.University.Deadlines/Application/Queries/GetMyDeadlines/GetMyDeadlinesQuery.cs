using HacatonMax.Common.AuthHelper;
using HacatonMax.University.Deadlines.Application.Models;
using HacatonMax.University.Deadlines.Infrastructure;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Deadlines.Application.Queries.GetMyDeadlines;

public sealed record GetMyDeadlinesQuery(bool OnlyActive) : IRequest<IReadOnlyCollection<DeadlineDto>>;

public sealed class GetMyDeadlinesQueryHandler : IRequestHandler<GetMyDeadlinesQuery, IReadOnlyCollection<DeadlineDto>>
{
    private readonly DeadlinesDbContext _deadlinesDbContext;
    private readonly StructureDbContext _structureDbContext;
    private readonly IUserContextService _userContextService;

    public GetMyDeadlinesQueryHandler(
        DeadlinesDbContext deadlinesDbContext,
        StructureDbContext structureDbContext,
        IUserContextService userContextService)
    {
        _deadlinesDbContext = deadlinesDbContext;
        _structureDbContext = structureDbContext;
        _userContextService = userContextService;
    }

    public async Task<IReadOnlyCollection<DeadlineDto>> Handle(GetMyDeadlinesQuery request, CancellationToken cancellationToken)
    {
        var currentUser = _userContextService.GetCurrentUser();

        var groupIds = await _structureDbContext.GroupMembers
            .Where(member => member.StudentId == currentUser.Id)
            .Select(member => member.GroupId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (groupIds.Count == 0)
        {
            return Array.Empty<DeadlineDto>();
        }

        var queryable = _deadlinesDbContext.Deadlines
            .Include(x => x.Completions)
            .Where(x => groupIds.Contains(x.GroupId));

        if (request.OnlyActive)
        {
            queryable = queryable.Where(x => x.Status == Domain.DeadlineStatus.Active);
        }

        var deadlines = await queryable
            .OrderBy(x => x.DueAt)
            .ToListAsync(cancellationToken);

        return deadlines.Select(DeadlineMapper.Map).ToList();
    }
}


