using HacatonMax.Common.Exceptions;
using HacatonMax.University.Events.Domain;
using HacatonMax.University.StudentsProject.Controllers.Dto;
using HacatonMax.University.StudentsProject.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.CreateStudentProjects;

public class CreateStudentProjectsHandler : IRequestHandler<CreateStudentProjectsCommand, StudentProjectsDto>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;
    private readonly IUniversityEventsRepository _universityEventsRepository;

    public CreateStudentProjectsHandler(
        IStudentProjectsRepository studentProjectsRepository,
        IUniversityEventsRepository universityEventsRepository)
    {
        _studentProjectsRepository = studentProjectsRepository;
        _universityEventsRepository = universityEventsRepository;
    }

    public async Task<StudentProjectsDto> Handle(CreateStudentProjectsCommand request, CancellationToken cancellationToken)
    {
        UniversityEvent? linkedEvent = null;

        if (request.EventId.HasValue)
        {
            linkedEvent = await _universityEventsRepository.GetById(request.EventId.Value);
            if (linkedEvent == null)
            {
                throw new NotFoundException($"University event with id '{request.EventId.Value}' was not found.");
            }
        }

        var studentProject = new StudentProject(
            Guid.NewGuid(),
            request.Title,
            request.Description,
            request.NeedSkills.Select(x => new Skill(x.Id, x.Name)).ToList(),
            request.EventId);

        await _studentProjectsRepository.Save(studentProject);
        return new StudentProjectsDto(
            studentProject.Id,
            studentProject.Title,
            studentProject.Description,
            request.NeedSkills,
            linkedEvent == null
                ? null
                : new StudentProjectEventDto(
                    linkedEvent.Id,
                    linkedEvent.Title,
                    linkedEvent.StartDateTime,
                    linkedEvent.EndDateTime));
    }
}
