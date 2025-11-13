using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using HacatonMax.Common.Abstractions;
using HacatonMax.University.Events.Application.Commands.SendUniversityEventReminder;
using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Services;

internal sealed class UniversityEventReminderScheduler : IUniversityEventReminderScheduler
{
    private readonly IJobsProvider _jobsProvider;

    public UniversityEventReminderScheduler(IJobsProvider jobsProvider)
    {
        _jobsProvider = jobsProvider;
    }

    public async Task ScheduleForRegistration(
        UniversityEvent universityEvent,
        long userId,
        CancellationToken cancellationToken)
    {
        await ScheduleInternal(universityEvent, userId, cancellationToken);
    }

    public async Task RescheduleForEvent(
        UniversityEvent universityEvent,
        IReadOnlyCollection<UniversityEventRegistration> registrations,
        CancellationToken cancellationToken)
    {
        foreach (var registration in registrations)
        {
            await ScheduleInternal(universityEvent, registration.UserId, cancellationToken);
        }
    }

    public async Task DeleteForEvent(
        long eventId,
        IReadOnlyCollection<UniversityEventRegistration> registrations)
    {
        foreach (var registration in registrations)
        {
            var jobId = SendUniversityEventReminderCommand.BuildJobId(eventId, registration.UserId);
            await _jobsProvider.DeleteJob(jobId);
        }
    }

    public async Task DeleteForRegistration(long eventId, long userId)
    {
        var jobId = SendUniversityEventReminderCommand.BuildJobId(eventId, userId);
        await _jobsProvider.DeleteJob(jobId);
    }

    private async Task ScheduleInternal(
        UniversityEvent universityEvent,
        long userId,
        CancellationToken cancellationToken)
    {
        var jobId = SendUniversityEventReminderCommand.BuildJobId(universityEvent.Id, userId);
        await _jobsProvider.DeleteJob(jobId);

        var enqueueAt = CalculateReminderDate(universityEvent.StartDateTime);

        if (enqueueAt == null)
        {
            return;
        }

        var command = new SendUniversityEventReminderCommand(universityEvent.Id, userId);
        await _jobsProvider.ScheduleJobWithTag<IMediator>(
            mediator => mediator.Send(command, cancellationToken),
            jobId,
            enqueueAt);
    }

    private static DateTimeOffset? CalculateReminderDate(DateTimeOffset eventStartDateTime)
    {
        var reminderAt = eventStartDateTime.AddDays(-1);

        if (reminderAt <= DateTimeOffset.UtcNow)
        {
            return DateTimeOffset.UtcNow.AddMinutes(1);
        }

        return reminderAt;
    }
}

