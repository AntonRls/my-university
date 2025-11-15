using HacatonMax.University.Schedule.Application.Common;
using HacatonMax.University.Schedule.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Schedule.Application.Commands.UpdateGroupLesson;

public sealed record UpdateGroupLessonCommand(
    long EntryId,
    long GroupId,
    string Title,
    string? Description,
    string? Teacher,
    string DeliveryType,
    string? PhysicalLocation,
    string? OnlineLink,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt) : IRequest;

public sealed class UpdateGroupLessonCommandHandler : IRequestHandler<UpdateGroupLessonCommand>
{
    private readonly ScheduleDbContext _scheduleDbContext;

    public UpdateGroupLessonCommandHandler(ScheduleDbContext scheduleDbContext)
    {
        _scheduleDbContext = scheduleDbContext;
    }

    public async Task Handle(UpdateGroupLessonCommand request, CancellationToken cancellationToken)
    {
        var entry = await _scheduleDbContext.ScheduleEntries
            .FirstOrDefaultAsync(
                x => x.Id == request.EntryId && x.GroupId == request.GroupId,
                cancellationToken);

        if (entry is null)
        {
            throw new InvalidOperationException($"Schedule entry {request.EntryId} for group {request.GroupId} not found");
        }

        entry.UpdateDetails(
            request.Title,
            request.Description,
            request.Teacher,
            request.PhysicalLocation,
            request.OnlineLink,
            request.StartsAt,
            request.EndsAt,
            ScheduleDeliveryTypeParser.Parse(request.DeliveryType));

        await _scheduleDbContext.SaveChangesAsync(cancellationToken);
    }
}

