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

    public CreateProgramCourseCommandHandler(StructureDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<long> Handle(CreateProgramCourseCommand request, CancellationToken cancellationToken)
    {
        var program = await _dbContext.AcademicPrograms
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.ProgramId, cancellationToken);

        if (program is null)
        {
            throw new InvalidOperationException($"Program {request.ProgramId} not found");
        }

        if (program.FacultyId != request.FacultyId)
        {
            throw new InvalidOperationException(
                $"Program {request.ProgramId} does not belong to faculty {request.FacultyId}");
        }

        var course = new ProgramCourse(request.ProgramId, request.CourseNumber, request.Title, request.Ects);
        _dbContext.ProgramCourses.Add(course);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return course.Id;
    }
}
