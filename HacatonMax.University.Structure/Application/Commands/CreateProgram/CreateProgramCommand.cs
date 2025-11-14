using HacatonMax.University.Structure.Domain;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Structure.Application.Commands.CreateProgram;

public record CreateProgramCommand(long FacultyId, string Name, string DegreeLevel) : IRequest<long>;

public sealed class CreateProgramCommandHandler : IRequestHandler<CreateProgramCommand, long>
{
    private readonly StructureDbContext _dbContext;

    public CreateProgramCommandHandler(StructureDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<long> Handle(CreateProgramCommand request, CancellationToken cancellationToken)
    {
        var faculty = await _dbContext.Faculties
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.FacultyId, cancellationToken);

        if (faculty is null)
        {
            throw new InvalidOperationException($"Faculty {request.FacultyId} not found");
        }

        var exists = await _dbContext.AcademicPrograms.AnyAsync(
            x => x.FacultyId == request.FacultyId && x.Name == request.Name,
            cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"Program {request.Name} already exists for faculty {request.FacultyId}");
        }

        var program = new AcademicProgram(request.FacultyId, request.Name, request.DegreeLevel);
        _dbContext.AcademicPrograms.Add(program);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return program.Id;
    }
}
