using HacatonMax.University.Structure.Application.Abstractions;
using HacatonMax.University.Structure.Domain;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Structure.Application.Commands.CreateProgram;

public record CreateProgramCommand(long FacultyId, string Name, string DegreeLevel) : IRequest<long>;

public sealed class CreateProgramCommandHandler : IRequestHandler<CreateProgramCommand, long>
{
    private readonly StructureDbContext _dbContext;
    private readonly ITenantContextAccessor _tenantContextAccessor;

    public CreateProgramCommandHandler(StructureDbContext dbContext, ITenantContextAccessor tenantContextAccessor)
    {
        _dbContext = dbContext;
        _tenantContextAccessor = tenantContextAccessor;
    }

    public async Task<long> Handle(CreateProgramCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContextAccessor.TenantId;

        var faculty = await _dbContext.Faculties
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.FacultyId && x.TenantId == tenantId, cancellationToken);

        if (faculty is null)
        {
            throw new InvalidOperationException($"Faculty {request.FacultyId} not found for tenant {tenantId}");
        }

        var exists = await _dbContext.AcademicPrograms.AnyAsync(
            x => x.FacultyId == request.FacultyId && x.TenantId == tenantId && x.Name == request.Name,
            cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"Program {request.Name} already exists for faculty {request.FacultyId}");
        }

        var program = AcademicProgram.Create(tenantId, request.FacultyId, request.Name, request.DegreeLevel);
        _dbContext.AcademicPrograms.Add(program);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return program.Id;
    }
}
