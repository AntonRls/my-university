using HacatonMax.Common.AuthHelper;
using HacatonMax.University.Schedule.Application.Common;
using HacatonMax.University.Schedule.Controllers.Dto;
using HacatonMax.University.Schedule.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Schedule.Application.Queries.GetGroupSchedule;

public sealed record GetGroupScheduleQuery(
    long GroupId,
    DateTimeOffset? From,
    DateTimeOffset? To,
    string? DeliveryType) : IRequest<List<ScheduleEntryDto>>;

public sealed class GetGroupScheduleQueryHandler : IRequestHandler<GetGroupScheduleQuery, List<ScheduleEntryDto>>
{
    private readonly ScheduleDbContext _scheduleDbContext;
    private readonly IUserContextService _userContextService;

    public GetGroupScheduleQueryHandler(
        ScheduleDbContext scheduleDbContext,
        IUserContextService userContextService)
    {
        _scheduleDbContext = scheduleDbContext;
        _userContextService = userContextService;
    }

    public async Task<List<ScheduleEntryDto>> Handle(GetGroupScheduleQuery request, CancellationToken cancellationToken)
    {
        var query = _scheduleDbContext.ScheduleEntries
            .AsNoTracking()
            .Include(entry => entry.Attendees)
            .Where(entry => entry.GroupId == request.GroupId);

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
        var currentUser = _userContextService.GetCurrentUser();
        return ScheduleEntryMapper.ToDtoList(entries, currentUser.Id);
    }
}

