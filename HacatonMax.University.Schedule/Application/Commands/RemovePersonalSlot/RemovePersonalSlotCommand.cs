using HacatonMax.Common.AuthHelper;
using HacatonMax.University.Schedule.Domain;
using HacatonMax.University.Schedule.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Schedule.Application.Commands.RemovePersonalSlot;

public sealed record RemovePersonalSlotCommand(long EntryId) : IRequest;

public sealed class RemovePersonalSlotCommandHandler : IRequestHandler<RemovePersonalSlotCommand>
{
    private readonly ScheduleDbContext _scheduleDbContext;
    private readonly IUserContextService _userContextService;

    public RemovePersonalSlotCommandHandler(
        ScheduleDbContext scheduleDbContext,
        IUserContextService userContextService)
    {
        _scheduleDbContext = scheduleDbContext;
        _userContextService = userContextService;
    }

    public async Task Handle(RemovePersonalSlotCommand request, CancellationToken cancellationToken)
    {
        var currentUser = _userContextService.GetCurrentUser();

        var entry = await _scheduleDbContext.ScheduleEntries
            .FirstOrDefaultAsync(
                x => x.Id == request.EntryId &&
                     x.OwnerUserId == currentUser.Id &&
                     x.SourceType == ScheduleSource.ManualPersonal,
                cancellationToken);

        if (entry is null)
        {
            return;
        }

        _scheduleDbContext.ScheduleEntries.Remove(entry);
        await _scheduleDbContext.SaveChangesAsync(cancellationToken);
    }
}

