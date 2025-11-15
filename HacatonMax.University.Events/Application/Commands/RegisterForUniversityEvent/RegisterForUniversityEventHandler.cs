using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.Events.Application.Common;
using HacatonMax.University.Events.Application.Services;
using HacatonMax.University.Events.Controllers.Dto;
using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.RegisterForUniversityEvent;

public sealed class RegisterForUniversityEventHandler
    : IRequestHandler<RegisterForUniversityEventCommand, UniversityEventDto>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;
    private readonly IUserContextService _userContextService;
    private readonly IUniversityEventReminderScheduler _reminderScheduler;

    public RegisterForUniversityEventHandler(
        IUniversityEventsRepository universityEventsRepository,
        IUserContextService userContextService,
        IUniversityEventReminderScheduler reminderScheduler)
    {
        _universityEventsRepository = universityEventsRepository;
        _userContextService = userContextService;
        _reminderScheduler = reminderScheduler;
    }

    public async Task<UniversityEventDto> Handle(RegisterForUniversityEventCommand request, CancellationToken cancellationToken)
    {
        var universityEvent = await _universityEventsRepository.GetById(request.EventId);

        if (universityEvent == null)
        {
            throw new NotFoundException($"Событие с ID {request.EventId} не найдено");
        }

        var currentUser = _userContextService.GetCurrentUser();

        var alreadyRegistered = await _universityEventsRepository.HasUserRegistration(
            universityEvent.Id,
            currentUser.Id);

        if (alreadyRegistered)
        {
            throw new BadRequestException("Вы уже записаны на это событие");
        }

        var registrationsCount = await _universityEventsRepository.GetRegistrationsCount(universityEvent.Id);

        if (!universityEvent.CanRegister(registrationsCount))
        {
            throw new BadRequestException("Достигнут лимит участников для события");
        }

        var registration = new UniversityEventRegistration(
            universityEvent.Id,
            currentUser.Id,
            DateTimeOffset.UtcNow);

        universityEvent.Registrations.Add(registration);

        await _universityEventsRepository.AddRegistration(registration);
        await _reminderScheduler.ScheduleForRegistration(universityEvent, currentUser.Id, cancellationToken);

        return UniversityEventMapper.ToDto(universityEvent, currentUser.Id);
    }
}

