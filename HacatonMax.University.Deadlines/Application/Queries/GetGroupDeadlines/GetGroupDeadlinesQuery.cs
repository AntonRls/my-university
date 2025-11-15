using HacatonMax.University.Deadlines.Application.Models;
using HacatonMax.University.Deadlines.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Deadlines.Application.Queries.GetGroupDeadlines;

public sealed record GetGroupDeadlinesQuery(long GroupId) : IRequest<IReadOnlyCollection<DeadlineDto>>;

public sealed class GetGroupDeadlinesQueryHandler : IRequestHandler<GetGroupDeadlinesQuery, IReadOnlyCollection<DeadlineDto>>
{
    private readonly DeadlinesDbContext _deadlinesDbContext;

    public GetGroupDeadlinesQueryHandler(DeadlinesDbContext deadlinesDbContext)
    {
        _deadlinesDbContext = deadlinesDbContext;
    }

    public async Task<IReadOnlyCollection<DeadlineDto>> Handle(GetGroupDeadlinesQuery request, CancellationToken cancellationToken)
    {
        var deadlines = await _deadlinesDbContext.Deadlines
            .Include(x => x.Completions)
            .Where(x => x.GroupId == request.GroupId)
            .OrderBy(x => x.DueAt)
            .ToListAsync(cancellationToken);

        return deadlines.Select(DeadlineMapper.Map).ToList();
    }
}


