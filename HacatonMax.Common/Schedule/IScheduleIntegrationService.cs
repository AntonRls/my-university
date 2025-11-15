namespace HacatonMax.Common.Schedule;

public interface IScheduleIntegrationService
{
    Task AddEventSubscriptionAsync(ScheduleEventSubscriptionPayload payload, CancellationToken cancellationToken);

    Task RemoveEventSubscriptionAsync(long tenantId, long eventId, long userId, CancellationToken cancellationToken);
}

