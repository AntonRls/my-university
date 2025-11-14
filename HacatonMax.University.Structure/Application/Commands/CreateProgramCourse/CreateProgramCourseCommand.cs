using HacatonMax.University.Structure.Application.Abstractions;
using HacatonMax.University.Structure.Domain;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Structure.Application.Commands.CreateProgramCourse;

public record CreateProgramCourseCommand(
    long FacultyId,
    long ProgramId,
    int CourseNumber,
    string Title,
    int? Ects) : IRequest<long>;

public sealed class CreateProgramCourseCommandHandler : IRequestHandler<CreateProgramCourseCommand, long>
{
    private readonly StructureDbContext _dbContext;
    private readonly ITenantContextAccessor _tenantContextAccessor;

    public CreateProgramCourseCommandHandler(StructureDbContext dbContext, ITenantContextAccessor tenantContextAccessor)
    {
        _dbContext = dbContext;
        _tenantContextAccessor = tenantContextAccessor;
    }

    public async Task<long> Handle(CreateProgramCourseCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContextAccessor.TenantId;

        var program = await _dbContext.AcademicPrograms
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.ProgramId && x.TenantId == tenantId, cancellationToken);

        if (program is null)
        {
            throw new InvalidOperationException($"Program {request.ProgramId} not found for tenant {tenantId}");
        }

        if (program.FacultyId != request.FacultyId)
        {
            throw new InvalidOperationException(
                $"Program {request.ProgramId} does not belong to faculty {request.FacultyId}");
        }

        var course = ProgramCourse.Create(tenantId, request.ProgramId, request.CourseNumber, request.Title, request.Ects);
        _dbContext.ProgramCourses.Add(course);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return course.Id;
    }
}
