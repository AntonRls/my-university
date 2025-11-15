using HacatonMax.Common.Schedule;
using HacatonMax.University.Schedule.Application.Common;
using HacatonMax.University.Schedule.Domain;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.Schedule.Infrastructure.Services;

public sealed class ScheduleIntegrationService : IScheduleIntegrationService
{
    private readonly ScheduleDbContext _dbContext;

    public ScheduleIntegrationService(ScheduleDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddEventSubscriptionAsync(ScheduleEventSubscriptionPayload payload, CancellationToken cancellationToken)
    {
        var deliveryType = ScheduleDeliveryTypeParser.Parse(payload.DeliveryType);
        var entry = await _dbContext.ScheduleEntries
            .Include(x => x.Attendees)
            .FirstOrDefaultAsync(
                x => x.TenantId == payload.TenantId &&
                     x.SourceType == ScheduleSource.UniversityEvent &&
                     x.SourceEntityId == payload.EventId,
                cancellationToken);

        if (entry is null)
        {
            entry = new ScheduleEntry(
                payload.TenantId,
                payload.Title,
                payload.Description,
                payload.Teacher,
                payload.PhysicalLocation,
                payload.OnlineLink,
                payload.StartsAt,
                payload.EndsAt,
                deliveryType,
                ScheduleSource.UniversityEvent,
                payload.UserId,
                null,
                null,
                payload.EventId);

            entry.Attendees.Add(new ScheduleAttendee(payload.UserId));
            await _dbContext.ScheduleEntries.AddAsync(entry, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        entry.UpdateSourceMetadata(
            payload.Title,
            payload.Description,
            payload.Teacher,
            payload.PhysicalLocation,
            payload.OnlineLink,
            payload.StartsAt,
            payload.EndsAt,
            deliveryType);

        if (entry.Attendees.All(x => x.UserId != payload.UserId))
        {
            entry.Attendees.Add(new ScheduleAttendee(payload.UserId));
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveEventSubscriptionAsync(long tenantId, long eventId, long userId, CancellationToken cancellationToken)
    {
        var entry = await _dbContext.ScheduleEntries
            .Include(x => x.Attendees)
            .FirstOrDefaultAsync(
                x => x.TenantId == tenantId &&
                     x.SourceType == ScheduleSource.UniversityEvent &&
                     x.SourceEntityId == eventId,
                cancellationToken);

        if (entry is null)
        {
            return;
        }

        var attendee = entry.Attendees.FirstOrDefault(x => x.UserId == userId);

        if (attendee is not null)
        {
            entry.Attendees.Remove(attendee);
        }

        if (entry.Attendees.Count == 0 && entry.GroupId is null && entry.OwnerUserId is null)
        {
            _dbContext.ScheduleEntries.Remove(entry);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

