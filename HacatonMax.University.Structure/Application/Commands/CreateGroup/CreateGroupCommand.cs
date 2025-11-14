using HacatonMax.University.Structure.Application.Abstractions;
using HacatonMax.University.Structure.Domain;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Structure.Application.Commands.CreateGroup;

public record CreateGroupCommand(
    long FacultyId,
    long ProgramId,
    long ProgramCourseId,
    GroupType Type,
    string Label,
    int Capacity,
    bool IsPrimaryAllowed,
    CustomGroupMetaPayload? CustomGroupMeta) : IRequest<long>;

public record CustomGroupMetaPayload(
    long? CreatedByUserId,
    CustomGroupCreatorRole CreatedByRole,
    CustomGroupVisibility Visibility,
    CustomGroupModerationStatus ModerationStatus);

public sealed class CreateGroupCommandHandler : IRequestHandler<CreateGroupCommand, long>
{
    private readonly StructureDbContext _dbContext;
    private readonly ITenantContextAccessor _tenantContextAccessor;

    public CreateGroupCommandHandler(StructureDbContext dbContext, ITenantContextAccessor tenantContextAccessor)
    {
        _dbContext = dbContext;
        _tenantContextAccessor = tenantContextAccessor;
    }

    public async Task<long> Handle(CreateGroupCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContextAccessor.TenantId;

        var programCourse = await _dbContext.ProgramCourses
            .Include(pc => pc.Program)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.ProgramCourseId && x.TenantId == tenantId, cancellationToken);

        if (programCourse is null)
        {
            throw new InvalidOperationException($"Program course {request.ProgramCourseId} not found for tenant {tenantId}");
        }

        if (programCourse.ProgramId != request.ProgramId)
        {
            throw new InvalidOperationException(
                $"Program course {request.ProgramCourseId} does not belong to program {request.ProgramId}");
        }

        if (programCourse.Program.FacultyId != request.FacultyId)
        {
            throw new InvalidOperationException(
                $"Program course {request.ProgramCourseId} does not belong to faculty {request.FacultyId}");
        }

        var group = Group.Create(
            tenantId,
            request.ProgramCourseId,
            request.Type,
            request.Label,
            request.Capacity,
            request.IsPrimaryAllowed);

        if (IsCustomGroup(request.Type))
        {
            if (request.CustomGroupMeta is null)
            {
                throw new InvalidOperationException("Custom groups must include metadata");
            }

            var meta = CustomGroupMeta.Create(
                request.CustomGroupMeta.CreatedByUserId,
                request.CustomGroupMeta.CreatedByRole,
                request.CustomGroupMeta.Visibility,
                request.CustomGroupMeta.ModerationStatus);

            group.AttachCustomMeta(meta);
        }
        else if (request.CustomGroupMeta is not null)
        {
            throw new InvalidOperationException("Metadata is only allowed for custom groups");
        }

        _dbContext.Groups.Add(group);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return group.Id;
    }

    private static bool IsCustomGroup(GroupType type)
    {
        return type is GroupType.CustomAdmin or GroupType.CustomUser;
    }
}
