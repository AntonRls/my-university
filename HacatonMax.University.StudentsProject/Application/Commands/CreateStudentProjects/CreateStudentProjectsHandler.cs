using HacatonMax.University.StudentsProject.Controllers.Dto;
using HacatonMax.University.StudentsProject.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.CreateStudentProjects;

public class CreateStudentProjectsHandler : IRequestHandler<CreateStudentProjectsCommand, StudentProjectsDto>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;

    public CreateStudentProjectsHandler(IStudentProjectsRepository  studentProjectsRepository)
    {
        _studentProjectsRepository = studentProjectsRepository;
    }

    public async Task<StudentProjectsDto> Handle(CreateStudentProjectsCommand request, CancellationToken cancellationToken)
    {
        var studentProject = new StudentProject(
            Guid.NewGuid(),
            request.Title,
            request.Description,
            request.NeedSkills.Select(x => new Skill(x.Id, x.Name)).ToList());

        await _studentProjectsRepository.Save(studentProject);
        return new StudentProjectsDto(
            studentProject.Id,
            studentProject.Title,
            studentProject.Description,
            request.NeedSkills);
    }
}
