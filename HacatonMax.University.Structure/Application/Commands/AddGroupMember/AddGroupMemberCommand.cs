using HacatonMax.University.Structure.Application.Abstractions;
using HacatonMax.University.Structure.Domain;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Structure.Application.Commands.AddGroupMember;

public record AddGroupMemberCommand(long GroupId, long StudentId, GroupMembershipType MembershipType) : IRequest;

public sealed class AddGroupMemberCommandHandler : IRequestHandler<AddGroupMemberCommand>
{
    private readonly StructureDbContext _dbContext;
    private readonly ITenantContextAccessor _tenantContextAccessor;

    public AddGroupMemberCommandHandler(StructureDbContext dbContext, ITenantContextAccessor tenantContextAccessor)
    {
        _dbContext = dbContext;
        _tenantContextAccessor = tenantContextAccessor;
    }

    public async Task Handle(AddGroupMemberCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContextAccessor.TenantId;
        var group = await _dbContext.Groups
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.GroupId && x.TenantId == tenantId, cancellationToken);

        if (group is null)
        {
            throw new InvalidOperationException($"Group {request.GroupId} not found for tenant {tenantId}");
        }

        if (request.MembershipType == GroupMembershipType.Primary && !group.IsPrimaryAllowed)
        {
            throw new InvalidOperationException("Primary membership is not allowed for this group");
        }

        var member = GroupMember.Create(request.GroupId, tenantId, request.StudentId, request.MembershipType);
        _dbContext.GroupMembers.Add(member);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
