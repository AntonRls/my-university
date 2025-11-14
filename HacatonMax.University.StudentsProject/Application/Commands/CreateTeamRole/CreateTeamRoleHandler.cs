using HacatonMax.Common.Exceptions;
using HacatonMax.University.StudentsProject.Controllers.Dto;
using HacatonMax.University.StudentsProject.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.CreateTeamRole;

public sealed class CreateTeamRoleHandler : IRequestHandler<CreateTeamRoleCommand, TeamRoleDto>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;

    public CreateTeamRoleHandler(IStudentProjectsRepository studentProjectsRepository)
    {
        _studentProjectsRepository = studentProjectsRepository;
    }

    public async Task<TeamRoleDto> Handle(CreateTeamRoleCommand request, CancellationToken cancellationToken)
    {
        var normalizedName = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName))
        {
            throw new BadRequestException("Название роли не может быть пустым.");
        }

        var existingRoles = await _studentProjectsRepository.GetTeamRolesByNames(new[] { normalizedName });
        if (existingRoles.Any())
        {
            var role = existingRoles.First();
            return new TeamRoleDto(role.Id, role.Name, role.Description);
        }

        var newRole = new TeamRole(Guid.NewGuid(), normalizedName, request.Description?.Trim());
        await _studentProjectsRepository.AddTeamRoles(new[] { newRole });
        await _studentProjectsRepository.SaveChanges();

        return new TeamRoleDto(newRole.Id, newRole.Name, newRole.Description);
    }
}

