using HacatonMax.University.StudentsProject.Controllers.Dto;
using HacatonMax.University.StudentsProject.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.GetAllSkills;

public class GetAllSkillsHandler : IRequestHandler<GetAllSkillsCommand, List<SkillDto>>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;

    public GetAllSkillsHandler(IStudentProjectsRepository  studentProjectsRepository)
    {
        _studentProjectsRepository = studentProjectsRepository;
    }

    public async Task<List<SkillDto>> Handle(GetAllSkillsCommand request, CancellationToken cancellationToken)
    {
        var skills = await _studentProjectsRepository.GetAllSkills();
        return skills.Select(x => new SkillDto(x.Id, x.Name)).ToList();
    }
}
