using HacatonMax.University.Structure.Application.Abstractions;
using HacatonMax.University.Structure.Domain;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Structure.Application.Queries.GetStructureTree;

public record GetStructureTreeQuery : IRequest<StructureTreeDto>;

public sealed class GetStructureTreeQueryHandler : IRequestHandler<GetStructureTreeQuery, StructureTreeDto>
{
    private readonly StructureDbContext _dbContext;
    private readonly ITenantContextAccessor _tenantContextAccessor;

    public GetStructureTreeQueryHandler(StructureDbContext dbContext, ITenantContextAccessor tenantContextAccessor)
    {
        _dbContext = dbContext;
        _tenantContextAccessor = tenantContextAccessor;
    }

    public async Task<StructureTreeDto> Handle(GetStructureTreeQuery request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContextAccessor.TenantId;

        var faculties = await _dbContext.Faculties
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .Include(x => x.Programs)
                .ThenInclude(p => p.Courses)
                    .ThenInclude(c => c.Groups)
                        .ThenInclude(g => g.Members)
            .Include(x => x.Programs)
                .ThenInclude(p => p.Courses)
                    .ThenInclude(c => c.Groups)
                        .ThenInclude(g => g.CustomMeta)
            .ToListAsync(cancellationToken);

        var facultyNodes = faculties
            .Select(faculty => new FacultyNodeDto(
                faculty.Id,
                faculty.Name,
                faculty.Code,
                faculty.Programs
                    .OrderBy(p => p.Name)
                    .Select(program => new ProgramNodeDto(
                        program.Id,
                        program.Name,
                        program.DegreeLevel,
                        program.Courses
                            .OrderBy(c => c.CourseNumber)
                            .Select(course => new CourseNodeDto(
                                course.Id,
                                course.CourseNumber,
                                course.Title,
                                course.Groups
                                    .OrderBy(g => g.Label)
                                    .Select(group => new GroupNodeDto(
                                        group.Id,
                                        group.Label,
                                        group.Type,
                                        group.IsPrimaryAllowed,
                                        group.Members
                                            .Select(member => new GroupMemberDto(
                                                member.StudentId,
                                                member.MembershipType))
                                            .ToList(),
                                        group.CustomMeta is null
                                            ? null
                                            : new CustomGroupMetaDto(
                                                group.CustomMeta.CreatedByUserId,
                                                group.CustomMeta.CreatedByRole,
                                                group.CustomMeta.Visibility,
                                                group.CustomMeta.ModerationStatus)))
                                    .ToList()))
                            .ToList()))
                    .ToList()))
            .ToList();

        return new StructureTreeDto(facultyNodes);
    }
}

public record StructureTreeDto(IReadOnlyCollection<FacultyNodeDto> Faculties);

public record FacultyNodeDto(long Id, string Name, string Code, IReadOnlyCollection<ProgramNodeDto> Programs);

public record ProgramNodeDto(long Id, string Name, string DegreeLevel, IReadOnlyCollection<CourseNodeDto> Courses);

public record CourseNodeDto(long Id, int CourseNumber, string Title, IReadOnlyCollection<GroupNodeDto> Groups);

public record GroupNodeDto(
    long Id,
    string Label,
    GroupType Type,
    bool IsPrimaryAllowed,
    IReadOnlyCollection<GroupMemberDto> Members,
    CustomGroupMetaDto? CustomMeta);

public record GroupMemberDto(long StudentId, GroupMembershipType MembershipType);

public record CustomGroupMetaDto(
    long? CreatedByUserId,
    CustomGroupCreatorRole CreatedByRole,
    CustomGroupVisibility Visibility,
    CustomGroupModerationStatus ModerationStatus);
