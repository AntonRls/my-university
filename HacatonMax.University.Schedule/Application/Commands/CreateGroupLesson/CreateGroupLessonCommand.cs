using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Options;
using HacatonMax.University.Schedule.Application.Common;
using HacatonMax.University.Schedule.Domain;
using HacatonMax.University.Schedule.Infrastructure;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TimeWarp.Mediator;

namespace HacatonMax.University.Schedule.Application.Commands.CreateGroupLesson;

public sealed record CreateGroupLessonCommand(
    long GroupId,
    string Title,
    string? Description,
    string? Teacher,
    string DeliveryType,
    string? PhysicalLocation,
    string? OnlineLink,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt) : IRequest<long>;

public sealed class CreateGroupLessonCommandHandler : IRequestHandler<CreateGroupLessonCommand, long>
{
    private readonly ScheduleDbContext _scheduleDbContext;
    private readonly StructureDbContext _structureDbContext;
    private readonly IUserContextService _userContextService;
    private readonly IOptions<TenantSettings> _tenantSettings;

    public CreateGroupLessonCommandHandler(
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

    public async Task<long> Handle(CreateGroupLessonCommand request, CancellationToken cancellationToken)
    {
        var groupExists = await _structureDbContext.Groups
            .AsNoTracking()
            .AnyAsync(group => group.Id == request.GroupId, cancellationToken);

        if (!groupExists)
        {
            throw new InvalidOperationException($"Group {request.GroupId} not found");
        }

        var deliveryType = ScheduleDeliveryTypeParser.Parse(request.DeliveryType);
        var currentUser = _userContextService.GetCurrentUser();

        var entry = new ScheduleEntry(
            _tenantSettings.Value.TenantId,
            request.Title,
            request.Description,
            request.Teacher,
            request.PhysicalLocation,
            request.OnlineLink,
            request.StartsAt,
            request.EndsAt,
            deliveryType,
            ScheduleSource.AdminLesson,
            currentUser.Id,
            request.GroupId,
            null,
            null);

        await _scheduleDbContext.ScheduleEntries.AddAsync(entry, cancellationToken);
        await _scheduleDbContext.SaveChangesAsync(cancellationToken);

        return entry.Id;
    }
}

