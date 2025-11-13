using System.Globalization;
using HacatonMax.Bot.Domain;
using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.SendUniversityEventReminder;

public sealed class SendUniversityEventReminderHandler : IRequestHandler<SendUniversityEventReminderCommand>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;
    private readonly IBotProvider _botProvider;

    public SendUniversityEventReminderHandler(
        IUniversityEventsRepository universityEventsRepository,
        IBotProvider botProvider)
    {
        _universityEventsRepository = universityEventsRepository;
        _botProvider = botProvider;
    }

    public async Task Handle(SendUniversityEventReminderCommand request, CancellationToken cancellationToken)
    {
        var universityEvent = await _universityEventsRepository.GetById(request.EventId);

        if (universityEvent == null)
        {
            return;
        }

        var message = BuildReminderMessage(universityEvent);

        await _botProvider.SendMessage(new Message
        {
            UserId = request.UserId,
            Text = message
        });
    }

    private static string BuildReminderMessage(UniversityEvent universityEvent)
    {
        var startDate = universityEvent.StartDateTime.ToString("dd.MM.yyyy HH:mm", CultureInfo.InvariantCulture);

        return $"Привет! Напоминаем, что мероприятие \"{universityEvent.Title}\" скоро состоится. " +
               $"Начало: {startDate}. Место проведения: {universityEvent.Location}.";
    }
}

