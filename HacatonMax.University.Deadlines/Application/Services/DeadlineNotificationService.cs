using HacatonMax.Common.Abstractions;
using HacatonMax.University.Deadlines.Application.Commands.DispatchDeadlineEvent;
using HacatonMax.University.Deadlines.Application.Commands.SendDeadlineReminder;
using HacatonMax.University.Deadlines.Domain;
using HacatonMax.University.Deadlines.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TimeWarp.Mediator;

namespace HacatonMax.University.Deadlines.Application.Services;

internal sealed class DeadlineNotificationService : IDeadlineNotificationService
{
    private static readonly (DeadlineReminderOffset Offset, TimeSpan Delay)[] ReminderTemplates =
    {
        (DeadlineReminderOffset.FiveDays, TimeSpan.FromDays(5)),
        (DeadlineReminderOffset.TwoDays, TimeSpan.FromDays(2)),
        (DeadlineReminderOffset.OneDay, TimeSpan.FromDays(1)),
        (DeadlineReminderOffset.OneHour, TimeSpan.FromHours(1))
    };

    private readonly IJobsProvider _jobsProvider;
    private readonly IMediator _mediator;
    private readonly DeadlinesDbContext _deadlinesDbContext;
    private readonly ILogger<DeadlineNotificationService> _logger;

    public DeadlineNotificationService(
        IJobsProvider jobsProvider,
        IMediator mediator,
        DeadlinesDbContext deadlinesDbContext,
        ILogger<DeadlineNotificationService> logger)
    {
        _jobsProvider = jobsProvider;
        _mediator = mediator;
        _deadlinesDbContext = deadlinesDbContext;
        _logger = logger;
    }

    public async Task HandleDeadlineCreated(Deadline deadline, long actorUserId, CancellationToken cancellationToken)
    {
        await DispatchEvent(deadline.Id, actorUserId, DeadlineEventType.Created, cancellationToken);
        await ScheduleReminders(deadline, cancellationToken);
    }

    public async Task HandleDeadlineUpdated(Deadline deadline, long actorUserId, CancellationToken cancellationToken)
    {
        await DispatchEvent(deadline.Id, actorUserId, DeadlineEventType.Updated, cancellationToken);
        await ScheduleReminders(deadline, cancellationToken);
    }

    public async Task HandleDeadlineDeleted(long deadlineId, CancellationToken cancellationToken)
    {
        await UnscheduleReminders(deadlineId, cancellationToken);
    }

    private async Task DispatchEvent(long deadlineId, long actorUserId, DeadlineEventType eventType, CancellationToken cancellationToken)
    {
        try
        {
            await _mediator.Send(new DispatchDeadlineEventCommand(deadlineId, actorUserId, eventType), cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Failed to dispatch deadline event for {DeadlineId}", deadlineId);
        }
    }

    private async Task ScheduleReminders(Deadline deadline, CancellationToken cancellationToken)
    {
        await UnscheduleReminders(deadline.Id, cancellationToken);

        foreach (var template in ReminderTemplates)
        {
            var fireAt = deadline.DueAt - template.Delay;

            if (fireAt <= DateTimeOffset.UtcNow)
            {
                continue;
            }

            var jobId = SendDeadlineReminderCommand.BuildJobId(deadline.Id, template.Offset);
            var command = new SendDeadlineReminderCommand(deadline.Id, template.Offset.ToString());

            await _jobsProvider.ScheduleJobWithTag<IMediator>(
                mediator => mediator.Send(command, cancellationToken),
                jobId,
                fireAt);

            var reminder = await _deadlinesDbContext.DeadlineReminders
                .FirstOrDefaultAsync(x => x.DeadlineId == deadline.Id && x.Offset == template.Offset, cancellationToken);

            if (reminder == null)
            {
                reminder = new DeadlineReminder(deadline.Id, template.Offset);
                await _deadlinesDbContext.DeadlineReminders.AddAsync(reminder, cancellationToken);
            }
        }

        await _deadlinesDbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task UnscheduleReminders(long deadlineId, CancellationToken cancellationToken)
    {
        foreach (var template in ReminderTemplates)
        {
            var jobId = SendDeadlineReminderCommand.BuildJobId(deadlineId, template.Offset);
            await _jobsProvider.DeleteJob(jobId);
        }

        var reminders = await _deadlinesDbContext.DeadlineReminders
            .Where(x => x.DeadlineId == deadlineId)
            .ToListAsync(cancellationToken);

        if (reminders.Count > 0)
        {
            _deadlinesDbContext.DeadlineReminders.RemoveRange(reminders);
            await _deadlinesDbContext.SaveChangesAsync(cancellationToken);
        }
    }
}


