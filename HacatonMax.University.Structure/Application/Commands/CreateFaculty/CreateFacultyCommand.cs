using HacatonMax.University.Structure.Application.Abstractions;
using HacatonMax.University.Structure.Domain;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Structure.Application.Commands.CreateFaculty;

public record CreateFacultyCommand(string Name, string Code) : IRequest<long>;

public sealed class CreateFacultyCommandHandler : IRequestHandler<CreateFacultyCommand, long>
{
    private readonly StructureDbContext _dbContext;
    private readonly ITenantContextAccessor _tenantContextAccessor;

    public CreateFacultyCommandHandler(StructureDbContext dbContext, ITenantContextAccessor tenantContextAccessor)
    {
        _dbContext = dbContext;
        _tenantContextAccessor = tenantContextAccessor;
    }

    public async Task<long> Handle(CreateFacultyCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContextAccessor.TenantId;
        var normalizedCode = request.Code.Trim().ToUpperInvariant();

        var exists = await _dbContext.Faculties
            .AnyAsync(x => x.TenantId == tenantId && x.Code == normalizedCode, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"Faculty with code {normalizedCode} already exists for tenant {tenantId}");
        }

        var faculty = Faculty.Create(tenantId, request.Name, normalizedCode);
        _dbContext.Faculties.Add(faculty);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return faculty.Id;
    }
}
