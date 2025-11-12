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

namespace HacatonMax.University.StudentsProject.Application.Commands.CreateStudentProjects;

public class CreateStudentProjectsHandler : IRequestHandler<CreateStudentProjectsCommand, StudentProjectsDto>
{
    private readonly IStudentProjectsRepository _studentProjectsRepository;
    private readonly IUniversityEventsRepository _universityEventsRepository;
    private readonly IUserContextService _userContextService;

    public CreateStudentProjectsHandler(
        IStudentProjectsRepository studentProjectsRepository,
        IUniversityEventsRepository universityEventsRepository,
        IUserContextService userContextService)
    {
        _studentProjectsRepository = studentProjectsRepository;
        _universityEventsRepository = universityEventsRepository;
        _userContextService = userContextService;
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

        var currentUser = _userContextService.GetCurrentUser();

        var studentProject = new StudentProject(
            Guid.NewGuid(),
            request.Title,
            request.Description,
            currentUser.Id,
            request.NeedSkills.Select(x => new Skill(x.Id, x.Name)).ToList(),
            request.EventId);

        var creatorParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            studentProject.Id,
            currentUser.Id,
            StudentProjectParticipantStatus.Approved,
            true,
            DateTimeOffset.UtcNow);
        creatorParticipant.SetParticipantRoles(new List<StudentProjectParticipantRole>());
        studentProject.AddParticipant(creatorParticipant);

        await _studentProjectsRepository.Save(studentProject);

        StudentProjectEventDto? eventDto = null;
        if (linkedEvent != null)
        {
            eventDto = new StudentProjectEventDto(
                linkedEvent.Id,
                linkedEvent.Title,
                linkedEvent.StartDateTime,
                linkedEvent.EndDateTime);
        }

        return StudentProjectDtoMapper.ToDto(studentProject, eventDto);
    }
}
