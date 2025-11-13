using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using HacatonMax.University.Events.Domain;

namespace HacatonMax.University.Events.Application.Services;

public interface IUniversityEventReminderScheduler
{
    Task ScheduleForRegistration(
        UniversityEvent universityEvent,
        long userId,
        CancellationToken cancellationToken);

    Task RescheduleForEvent(
        UniversityEvent universityEvent,
        IReadOnlyCollection<UniversityEventRegistration> registrations,
        CancellationToken cancellationToken);

    Task DeleteForEvent(
        long eventId,
        IReadOnlyCollection<UniversityEventRegistration> registrations);

    Task DeleteForRegistration(long eventId, long userId);
}

