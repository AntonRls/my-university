using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Options;
using HacatonMax.University.Schedule.Application.Common;
using HacatonMax.University.Schedule.Domain;
using HacatonMax.University.Schedule.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TimeWarp.Mediator;

namespace HacatonMax.University.Schedule.Application.Commands.UpsertPersonalSlot;

public sealed record UpsertPersonalSlotCommand(
    long? EntryId,
    string Title,
    string? Description,
    string? Teacher,
    string DeliveryType,
    string? PhysicalLocation,
    string? OnlineLink,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt) : IRequest<long>;

public sealed class UpsertPersonalSlotCommandHandler : IRequestHandler<UpsertPersonalSlotCommand, long>
{
    private readonly ScheduleDbContext _scheduleDbContext;
    private readonly IUserContextService _userContextService;
    private readonly IOptions<TenantSettings> _tenantSettings;

    public UpsertPersonalSlotCommandHandler(
        ScheduleDbContext scheduleDbContext,
        IUserContextService userContextService,
        IOptions<TenantSettings> tenantSettings)
    {
        _scheduleDbContext = scheduleDbContext;
        _userContextService = userContextService;
        _tenantSettings = tenantSettings;
    }

    public async Task<long> Handle(UpsertPersonalSlotCommand request, CancellationToken cancellationToken)
    {
        var currentUser = _userContextService.GetCurrentUser();

        if (request.EntryId.HasValue)
        {
            var existingEntry = await _scheduleDbContext.ScheduleEntries
                .FirstOrDefaultAsync(
                    entry => entry.Id == request.EntryId.Value &&
                             entry.OwnerUserId == currentUser.Id &&
                             entry.SourceType == ScheduleSource.ManualPersonal,
                    cancellationToken);

            if (existingEntry is null)
            {
                throw new InvalidOperationException($"Personal schedule entry {request.EntryId.Value} not found");
            }

            existingEntry.UpdateDetails(
                request.Title,
                request.Description,
                request.Teacher,
                request.PhysicalLocation,
                request.OnlineLink,
                request.StartsAt,
                request.EndsAt,
                ScheduleDeliveryTypeParser.Parse(request.DeliveryType));

            await _scheduleDbContext.SaveChangesAsync(cancellationToken);
            return existingEntry.Id;
        }

        var entry = new ScheduleEntry(
            _tenantSettings.Value.TenantId,
            request.Title,
            request.Description,
            request.Teacher,
            request.PhysicalLocation,
            request.OnlineLink,
            request.StartsAt,
            request.EndsAt,
            ScheduleDeliveryTypeParser.Parse(request.DeliveryType),
            ScheduleSource.ManualPersonal,
            currentUser.Id,
            null,
            currentUser.Id,
            null);

        await _scheduleDbContext.ScheduleEntries.AddAsync(entry, cancellationToken);
        await _scheduleDbContext.SaveChangesAsync(cancellationToken);
        return entry.Id;
    }
}

