using HacatonMax.University.Deadlines.Application.Models;
using HacatonMax.University.Deadlines.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Deadlines.Application.Queries.GetDeadlineDetails;

public sealed record GetDeadlineDetailsQuery(long DeadlineId) : IRequest<DeadlineDto>;

public sealed class GetDeadlineDetailsQueryHandler : IRequestHandler<GetDeadlineDetailsQuery, DeadlineDto>
{
    private readonly DeadlinesDbContext _deadlinesDbContext;

    public GetDeadlineDetailsQueryHandler(DeadlinesDbContext deadlinesDbContext)
    {
        _deadlinesDbContext = deadlinesDbContext;
    }

    public async Task<DeadlineDto> Handle(GetDeadlineDetailsQuery request, CancellationToken cancellationToken)
    {
        var deadline = await _deadlinesDbContext.Deadlines
            .Include(x => x.Completions)
            .FirstOrDefaultAsync(x => x.Id == request.DeadlineId, cancellationToken);

        if (deadline is null)
        {
            throw new InvalidOperationException($"Deadline {request.DeadlineId} not found");
        }

        return DeadlineMapper.Map(deadline);
    }
}


