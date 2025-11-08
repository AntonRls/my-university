using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.CreateUniversityEvent;

public class CreateUniversityEventHandler : IRequestHandler<CreateUniversityEventCommand>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;

    public CreateUniversityEventHandler(IUniversityEventsRepository  universityEventsRepository)
    {
        _universityEventsRepository = universityEventsRepository;
    }

    public async Task Handle(CreateUniversityEventCommand request, CancellationToken cancellationToken)
    {
        var universityEvent = new UniversityEvent(
            request.Title,
            request.Description,
            request.StartDateTime,
            request.EndDateTime,
            request.ParticipantsLimit,
            request.Tags.Select(x => new Tag(x.Id, x.Name)).ToList());

        await _universityEventsRepository.Save(universityEvent);
    }
}
