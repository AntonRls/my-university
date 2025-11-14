using HacatonMax.University.Structure.Domain;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using TimeWarp.Mediator;

namespace HacatonMax.University.Structure.Application.Commands.CreateFaculty;

public record CreateFacultyCommand(string Name, string Code) : IRequest<long>;

public sealed class CreateFacultyCommandHandler : IRequestHandler<CreateFacultyCommand, long>
{
    private readonly StructureDbContext _dbContext;

    public CreateFacultyCommandHandler(StructureDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<long> Handle(CreateFacultyCommand request, CancellationToken cancellationToken)
    {
        var normalizedCode = request.Code.Trim().ToUpperInvariant();

        var exists = await _dbContext.Faculties
            .AnyAsync(x => x.Code == normalizedCode, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"Faculty with code {normalizedCode} already exists");
        }

        var faculty = new Faculty(request.Name, normalizedCode);
        _dbContext.Faculties.Add(faculty);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return faculty.Id;
    }
}
