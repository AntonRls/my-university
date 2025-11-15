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

namespace HacatonMax.University.Events.Application.Commands.RegisterForUniversityEvent;

public sealed class RegisterForUniversityEventHandler
    : IRequestHandler<RegisterForUniversityEventCommand, UniversityEventDto>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;
    private readonly IUserContextService _userContextService;
    private readonly IUniversityEventReminderScheduler _reminderScheduler;
    private readonly IScheduleIntegrationService _scheduleIntegrationService;
    private readonly IOptions<TenantSettings> _tenantSettings;

    public RegisterForUniversityEventHandler(
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
        await _scheduleIntegrationService.AddEventSubscriptionAsync(
            new ScheduleEventSubscriptionPayload(
                _tenantSettings.Value.TenantId,
                universityEvent.Id,
                currentUser.Id,
                universityEvent.Title,
                universityEvent.Description,
                null,
                GetPhysicalLocation(universityEvent.Location),
                GetOnlineLink(universityEvent.Location),
                universityEvent.StartDateTime,
                universityEvent.EndDateTime,
                ResolveDeliveryType(universityEvent.Location)),
            cancellationToken);

        return UniversityEventMapper.ToDto(universityEvent, currentUser.Id);
    }

    private const string OnlineDeliveryType = "Online";
    private const string OfflineDeliveryType = "Offline";

    private static string ResolveDeliveryType(string location)
    {
        return Uri.TryCreate(location, UriKind.Absolute, out var uri) &&
               (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
            ? OnlineDeliveryType
            : OfflineDeliveryType;
    }

    private static string? GetPhysicalLocation(string location)
    {
        return ResolveDeliveryType(location) == OfflineDeliveryType ? location : null;
    }

    private static string? GetOnlineLink(string location)
    {
        return ResolveDeliveryType(location) == OnlineDeliveryType ? location : null;
    }
}

