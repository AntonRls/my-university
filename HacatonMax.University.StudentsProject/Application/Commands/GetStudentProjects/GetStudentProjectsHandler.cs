using HacatonMax.University.StudentsProject.Controllers.Dto;
using HacatonMax.University.StudentsProject.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjects;

public class GetStudentProjectsHandler : IRequestHandler<GetStudentProjectsCommand, List<StudentProjectsDto>>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;

    public GetStudentProjectsHandler(IStudentProjectsRepository  studentProjectsRepository)
    {
        _studentProjectsRepository = studentProjectsRepository;
    }

    public async Task<List<StudentProjectsDto>> Handle(GetStudentProjectsCommand request, CancellationToken cancellationToken)
    {
        var projects = await _studentProjectsRepository.GetProjectsByFilter(request.NeedSkills);
        return projects.Select(x =>
                new StudentProjectsDto(x.Id, x.Title, x.Description, x.NeedSkills
                    .Select(skill => new SkillDto(skill.Id, skill.Name))
                    .ToList()))
            .ToList();
    }
}
