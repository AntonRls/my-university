using HacatonMax.University.Events.Domain;
using HacatonMax.University.StudentsProject.Application.Mappers;
using HacatonMax.University.StudentsProject.Controllers.Dto;
using HacatonMax.University.StudentsProject.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjects;

public class GetStudentProjectsHandler : IRequestHandler<GetStudentProjectsCommand, List<StudentProjectsDto>>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;
    private readonly IUniversityEventsRepository _universityEventsRepository;

    public GetStudentProjectsHandler(
        IStudentProjectsRepository studentProjectsRepository,
        IUniversityEventsRepository universityEventsRepository)
    {
        _studentProjectsRepository = studentProjectsRepository;
        _universityEventsRepository = universityEventsRepository;
    }

    public async Task<List<StudentProjectsDto>> Handle(GetStudentProjectsCommand request, CancellationToken cancellationToken)
    {
        var projects = await _studentProjectsRepository.GetProjectsByFilter(request.NeedSkills, request.EventId);

        var eventIds = projects
            .Where(project => project.EventId.HasValue)
            .Select(project => project.EventId!.Value)
            .Distinct()
            .ToList();

        var events = eventIds.Count == 0
            ? new List<UniversityEvent>()
            : await _universityEventsRepository.GetByIds(eventIds);

        var eventsById = events.ToDictionary(@event => @event.Id);

        return projects.Select(project =>
            {
                StudentProjectEventDto? eventDto = null;
                if (project.EventId.HasValue &&
                    eventsById.TryGetValue(project.EventId.Value, out var eventEntity))
                {
                    eventDto = new StudentProjectEventDto(
                        eventEntity.Id,
                        eventEntity.Title,
                        eventEntity.StartDateTime,
                        eventEntity.EndDateTime);
                }

                return StudentProjectDtoMapper.ToDto(project, eventDto);
            })
            .ToList();
    }
}
