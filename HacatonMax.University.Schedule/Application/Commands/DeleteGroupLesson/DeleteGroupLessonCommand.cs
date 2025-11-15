using HacatonMax.University.Schedule.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Schedule.Application.Commands.DeleteGroupLesson;

public sealed record DeleteGroupLessonCommand(long EntryId, long GroupId) : IRequest;

public sealed class DeleteGroupLessonCommandHandler : IRequestHandler<DeleteGroupLessonCommand>
{
    private readonly ScheduleDbContext _scheduleDbContext;

    public DeleteGroupLessonCommandHandler(ScheduleDbContext scheduleDbContext)
    {
        _scheduleDbContext = scheduleDbContext;
    }

    public async Task Handle(DeleteGroupLessonCommand request, CancellationToken cancellationToken)
    {
        var entry = await _scheduleDbContext.ScheduleEntries
            .FirstOrDefaultAsync(
                x => x.Id == request.EntryId && x.GroupId == request.GroupId,
                cancellationToken);

        if (entry is null)
        {
            return;
        }

        _scheduleDbContext.ScheduleEntries.Remove(entry);
        await _scheduleDbContext.SaveChangesAsync(cancellationToken);
    }
}

