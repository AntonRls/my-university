using HacatonMax.University.Structure.Domain;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Structure.Application.Commands.AddGroupMember;

public record AddGroupMemberCommand(long GroupId, long StudentId, GroupMembershipType MembershipType) : IRequest;

public sealed class AddGroupMemberCommandHandler : IRequestHandler<AddGroupMemberCommand>
{
    private readonly StructureDbContext _dbContext;

    public AddGroupMemberCommandHandler(StructureDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task Handle(AddGroupMemberCommand request, CancellationToken cancellationToken)
    {
        var group = await _dbContext.Groups
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.GroupId, cancellationToken);

        if (group is null)
        {
            throw new InvalidOperationException($"Group {request.GroupId} not found");
        }

        if (request.MembershipType == GroupMembershipType.Primary && !group.IsPrimaryAllowed)
        {
            throw new InvalidOperationException("Primary membership is not allowed for this group");
        }

        var member = new GroupMember(request.GroupId, request.StudentId, request.MembershipType);
        _dbContext.GroupMembers.Add(member);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
