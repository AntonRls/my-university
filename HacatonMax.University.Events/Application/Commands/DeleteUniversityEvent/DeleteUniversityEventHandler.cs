using HacatonMax.Common.Exceptions;
using HacatonMax.University.Events.Application.Services;
using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.DeleteUniversityEvent;

public sealed class DeleteUniversityEventHandler : IRequestHandler<DeleteUniversityEventCommand>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;
    private readonly IUniversityEventReminderScheduler _reminderScheduler;

    public DeleteUniversityEventHandler(
        IUniversityEventsRepository universityEventsRepository,
        IUniversityEventReminderScheduler reminderScheduler)
    {
        _universityEventsRepository = universityEventsRepository;
        _reminderScheduler = reminderScheduler;
    }

    public async Task Handle(DeleteUniversityEventCommand request, CancellationToken cancellationToken)
    {
        var universityEvent = await _universityEventsRepository.GetById(request.EventId);

        if (universityEvent == null)
        {
            throw new NotFoundException($"Событие с ID {request.EventId} не найдено");
        }

        await _reminderScheduler.DeleteForEvent(universityEvent.Id, universityEvent.Registrations);
        await _universityEventsRepository.Delete(universityEvent);
    }
}

