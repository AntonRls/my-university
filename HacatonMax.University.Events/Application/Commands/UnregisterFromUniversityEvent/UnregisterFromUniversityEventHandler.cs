using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Exceptions;
using HacatonMax.Common.Options;
using HacatonMax.Common.Schedule;
using HacatonMax.University.Events.Application.Common;
using HacatonMax.University.Events.Application.Services;
using HacatonMax.University.Events.Controllers.Dto;
using HacatonMax.University.Events.Domain;
using Microsoft.Extensions.Options;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.UnregisterFromUniversityEvent;

public sealed class UnregisterFromUniversityEventHandler
    : IRequestHandler<UnregisterFromUniversityEventCommand, UniversityEventDto>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;
    private readonly IUserContextService _userContextService;
    private readonly IUniversityEventReminderScheduler _reminderScheduler;
    private readonly IScheduleIntegrationService _scheduleIntegrationService;
    private readonly IOptions<TenantSettings> _tenantSettings;

    public UnregisterFromUniversityEventHandler(
        IUniversityEventsRepository universityEventsRepository,
        IUserContextService userContextService,
        IUniversityEventReminderScheduler reminderScheduler,
        IScheduleIntegrationService scheduleIntegrationService,
        IOptions<TenantSettings> tenantSettings)
    {
        _universityEventsRepository = universityEventsRepository;
        _userContextService = userContextService;
        _reminderScheduler = reminderScheduler;
        _scheduleIntegrationService = scheduleIntegrationService;
        _tenantSettings = tenantSettings;
    }

    public async Task<UniversityEventDto> Handle(UnregisterFromUniversityEventCommand request, CancellationToken cancellationToken)
    {
        var universityEvent = await _universityEventsRepository.GetById(request.EventId);

        if (universityEvent == null)
        {
            throw new NotFoundException($"Событие с ID {request.EventId} не найдено");
        }

        var currentUser = _userContextService.GetCurrentUser();

        var registration = await _universityEventsRepository.GetUserRegistration(
            universityEvent.Id,
            currentUser.Id);

        if (registration == null)
        {
            throw new BadRequestException("Вы не записаны на это событие");
        }

        universityEvent.Registrations.Remove(registration);
        await _universityEventsRepository.RemoveRegistration(registration);
        await _reminderScheduler.DeleteForRegistration(universityEvent.Id, currentUser.Id);
        await _scheduleIntegrationService.RemoveEventSubscriptionAsync(
            _tenantSettings.Value.TenantId,
            universityEvent.Id,
            currentUser.Id,
            cancellationToken);

        return UniversityEventMapper.ToDto(universityEvent, currentUser.Id);
    }
}

