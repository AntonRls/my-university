using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Options;
using HacatonMax.University.Schedule.Application.Common;
using HacatonMax.University.Schedule.Controllers.Dto;
using HacatonMax.University.Schedule.Infrastructure;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TimeWarp.Mediator;

namespace HacatonMax.University.Schedule.Application.Queries.GetMySchedule;

public sealed record GetMyScheduleQuery(
    DateTimeOffset? From,
    DateTimeOffset? To,
    string? DeliveryType) : IRequest<List<ScheduleEntryDto>>;

public sealed class GetMyScheduleQueryHandler : IRequestHandler<GetMyScheduleQuery, List<ScheduleEntryDto>>
{
    private readonly ScheduleDbContext _scheduleDbContext;
    private readonly StructureDbContext _structureDbContext;
    private readonly IUserContextService _userContextService;
    private readonly IOptions<TenantSettings> _tenantSettings;

    public GetMyScheduleQueryHandler(
        ScheduleDbContext scheduleDbContext,
        StructureDbContext structureDbContext,
        IUserContextService userContextService,
        IOptions<TenantSettings> tenantSettings)
    {
        _scheduleDbContext = scheduleDbContext;
        _structureDbContext = structureDbContext;
        _userContextService = userContextService;
        _tenantSettings = tenantSettings;
    }

    public async Task<List<ScheduleEntryDto>> Handle(GetMyScheduleQuery request, CancellationToken cancellationToken)
    {
        var currentUser = _userContextService.GetCurrentUser();
        var groupIds = await _structureDbContext.GroupMembers
            .AsNoTracking()
            .Where(member => member.StudentId == currentUser.Id)
            .Select(member => member.GroupId)
            .ToListAsync(cancellationToken);

        var tenantId = _tenantSettings.Value.TenantId;

        var query = _scheduleDbContext.ScheduleEntries
            .AsNoTracking()
            .Include(entry => entry.Attendees)
            .Where(entry => entry.TenantId == tenantId)
            .Where(entry =>
                (entry.GroupId.HasValue && groupIds.Contains(entry.GroupId.Value)) ||
                entry.OwnerUserId == currentUser.Id ||
                entry.Attendees.Any(attendee => attendee.UserId == currentUser.Id));

        if (request.From.HasValue)
        {
            query = query.Where(entry => entry.EndsAt >= request.From.Value);
        }

        if (request.To.HasValue)
        {
            query = query.Where(entry => entry.StartsAt <= request.To.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.DeliveryType))
        {
            var deliveryType = ScheduleDeliveryTypeParser.Parse(request.DeliveryType);
            query = query.Where(entry => entry.DeliveryType == deliveryType);
        }

        var entries = await query.ToListAsync(cancellationToken);
        return ScheduleEntryMapper.ToDtoList(entries, currentUser.Id);
    }
}

