using HacatonMax.Common.AuthHelper;
using HacatonMax.University.Structure.Application.Queries.GetStructureTree;
using HacatonMax.University.Structure.Domain;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Structure.Application.Queries.GetMyGroups;

public sealed record GetMyGroupsQuery : IRequest<IReadOnlyCollection<UserGroupDto>>;

public sealed class GetMyGroupsQueryHandler : IRequestHandler<GetMyGroupsQuery, IReadOnlyCollection<UserGroupDto>>
{
    private readonly StructureDbContext _structureDbContext;
    private readonly IUserContextService _userContextService;

    public GetMyGroupsQueryHandler(StructureDbContext structureDbContext, IUserContextService userContextService)
    {
        _structureDbContext = structureDbContext;
        _userContextService = userContextService;
    }

    public async Task<IReadOnlyCollection<UserGroupDto>> Handle(GetMyGroupsQuery request, CancellationToken cancellationToken)
    {
        var currentUser = _userContextService.GetCurrentUser();

        var groupIds = await _structureDbContext.GroupMembers
            .Where(member => member.StudentId == currentUser.Id)
            .Select(member => member.GroupId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (groupIds.Count == 0)
        {
            return Array.Empty<UserGroupDto>();
        }

        var groups = await _structureDbContext.Groups
            .Include(group => group.CustomMeta)
            .Where(group => groupIds.Contains(group.Id))
            .OrderBy(group => group.Label)
            .ToListAsync(cancellationToken);

        return groups.Select(group => new UserGroupDto(
            group.Id,
            group.Label,
            group.Type,
            group.IsPrimaryAllowed,
            group.CustomMeta is null
                ? null
                : new CustomGroupMetaDto(
                    group.CustomMeta.CreatedByUserId,
                    group.CustomMeta.CreatedByRole,
                    group.CustomMeta.Visibility,
                    group.CustomMeta.ModerationStatus)))
            .ToList();
    }
}

public sealed record UserGroupDto(
    long Id,
    string Label,
    GroupType Type,
    bool IsPrimaryAllowed,
    CustomGroupMetaDto? CustomMeta);


