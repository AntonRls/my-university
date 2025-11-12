using System;
using System.Collections.Generic;
using System.Linq;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.Auth.Domain;
using HacatonMax.University.Events.Domain;
using HacatonMax.University.StudentsProject.Controllers.Dto;
using HacatonMax.University.StudentsProject.Domain;
using HacatonMax.University.StudentsProject.Application.Mappers;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.UpdateStudentProject;

public class UpdateStudentProjectHandler : IRequestHandler<UpdateStudentProjectCommand, StudentProjectsDto>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;
    private readonly IUniversityEventsRepository _universityEventsRepository;
    private readonly IUserContextService _userContextService;

    public UpdateStudentProjectHandler(
        IStudentProjectsRepository studentProjectsRepository,
        IUniversityEventsRepository universityEventsRepository,
        IUserContextService userContextService)
    {
        _studentProjectsRepository = studentProjectsRepository;
        _universityEventsRepository = universityEventsRepository;
        _userContextService = userContextService;
    }

    public async Task<StudentProjectsDto> Handle(UpdateStudentProjectCommand request, CancellationToken cancellationToken)
    {
        var project = await _studentProjectsRepository.GetById(request.ProjectId);
        if (project == null)
        {
            throw new NotFoundException($"Проект с идентификатором {request.ProjectId} не найден.");
        }

        var currentUser = _userContextService.GetCurrentUser();
        if (project.CreatorId != currentUser.Id)
        {
            throw new ForbiddenException("Только создатель проекта может изменять его.");
        }

        UniversityEvent? linkedEvent = null;
        if (request.EventId.HasValue)
        {
            linkedEvent = await _universityEventsRepository.GetById(request.EventId.Value);
            if (linkedEvent == null)
            {
                throw new NotFoundException($"Событие с идентификатором {request.EventId.Value} не найдено.");
            }
        }

        project.UpdateDetails(request.Title, request.Description);
        project.UpdateEvent(request.EventId);

        var skillsDictionary = request.NeedSkills
            .ToDictionary(skill => skill.Id, skill => skill.Name);

        await _studentProjectsRepository.Update(project, skillsDictionary);

        StudentProjectEventDto? eventDto = null;
        if (linkedEvent != null)
        {
            eventDto = new StudentProjectEventDto(
                linkedEvent.Id,
                linkedEvent.Title,
                linkedEvent.StartDateTime,
                linkedEvent.EndDateTime);
        }

        return StudentProjectDtoMapper.ToDto(project, eventDto);
    }
}

