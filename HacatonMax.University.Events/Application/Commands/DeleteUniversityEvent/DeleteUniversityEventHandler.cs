using HacatonMax.Common.Exceptions;
using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.DeleteUniversityEvent;

public sealed class DeleteUniversityEventHandler : IRequestHandler<DeleteUniversityEventCommand>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;

    public DeleteUniversityEventHandler(IUniversityEventsRepository universityEventsRepository)
    {
        _universityEventsRepository = universityEventsRepository;
    }

    public async Task Handle(DeleteUniversityEventCommand request, CancellationToken cancellationToken)
    {
        var universityEvent = await _universityEventsRepository.GetById(request.EventId);

        if (universityEvent == null)
        {
            throw new NotFoundException($"Событие с ID {request.EventId} не найдено");
        }

        await _universityEventsRepository.Delete(universityEvent);
    }
}

