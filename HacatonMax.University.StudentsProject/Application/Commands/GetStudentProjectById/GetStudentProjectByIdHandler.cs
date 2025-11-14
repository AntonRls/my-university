using HacatonMax.Common.Exceptions;
using HacatonMax.University.Events.Domain;
using HacatonMax.University.StudentsProject.Application.Mappers;
using HacatonMax.University.StudentsProject.Controllers.Dto;
using HacatonMax.University.StudentsProject.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjectById;

public class GetStudentProjectByIdHandler : IRequestHandler<GetStudentProjectByIdCommand, StudentProjectsDto>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;
    private readonly IUniversityEventsRepository _universityEventsRepository;

    public GetStudentProjectByIdHandler(
        IStudentProjectsRepository studentProjectsRepository,
        IUniversityEventsRepository universityEventsRepository)
    {
        _studentProjectsRepository = studentProjectsRepository;
        _universityEventsRepository = universityEventsRepository;
    }

    public async Task<StudentProjectsDto> Handle(GetStudentProjectByIdCommand request, CancellationToken cancellationToken)
    {
        var project = await _studentProjectsRepository.GetById(request.ProjectId);
        if (project == null)
        {
            throw new NotFoundException($"Проект с идентификатором {request.ProjectId} не найден.");
        }

        StudentProjectEventDto? eventDto = null;
        if (project.EventId.HasValue)
        {
            var linkedEvent = await _universityEventsRepository.GetById(project.EventId.Value);
            if (linkedEvent != null)
            {
                eventDto = new StudentProjectEventDto(
                    linkedEvent.Id,
                    linkedEvent.Title,
                    linkedEvent.StartDateTime,
                    linkedEvent.EndDateTime);
            }
        }

        return StudentProjectDtoMapper.ToDto(project, eventDto);
    }
}

