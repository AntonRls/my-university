using HacatonMax.Common.AuthHelper;
using HacatonMax.University.Deadlines.Infrastructure;
using HacatonMax.University.Schedule.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Deadlines.Application.Commands.SyncDeadlineDueDate;

public sealed record SyncDeadlineDueDateCommand(long DeadlineId, long ScheduleEntryId) : IRequest;

public sealed class SyncDeadlineDueDateCommandHandler : IRequestHandler<SyncDeadlineDueDateCommand>
{
    private readonly DeadlinesDbContext _deadlinesDbContext;
    private readonly ScheduleDbContext _scheduleDbContext;
    private readonly IUserContextService _userContextService;

    public SyncDeadlineDueDateCommandHandler(
        DeadlinesDbContext deadlinesDbContext,
        ScheduleDbContext scheduleDbContext,
        IUserContextService userContextService)
    {
        _deadlinesDbContext = deadlinesDbContext;
        _scheduleDbContext = scheduleDbContext;
        _userContextService = userContextService;
    }

    public async Task Handle(SyncDeadlineDueDateCommand request, CancellationToken cancellationToken)
    {
        var deadline = await _deadlinesDbContext.Deadlines
            .FirstOrDefaultAsync(x => x.Id == request.DeadlineId, cancellationToken);

        if (deadline is null)
        {
            throw new InvalidOperationException($"Deadline {request.DeadlineId} not found");
        }

        var scheduleEntry = await _scheduleDbContext.ScheduleEntries
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.ScheduleEntryId, cancellationToken);

        if (scheduleEntry is null)
        {
            throw new InvalidOperationException($"Schedule entry {request.ScheduleEntryId} not found");
        }

        var currentUser = _userContextService.GetCurrentUser();
        var dueAt = scheduleEntry.StartsAt.AddHours(-1);

        deadline.SyncWithSchedule(scheduleEntry.Id, dueAt, currentUser.Id);
        await _deadlinesDbContext.SaveChangesAsync(cancellationToken);

        return;
    }
}


