using HacatonMax.University.Events.Controllers.Dto;
using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.GetUniversityEvents;

public class GetUniversityEventsHandler : IRequestHandler<GetUniversityEventsCommand, List<UniversityEventDto>>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;

    public GetUniversityEventsHandler(IUniversityEventsRepository  universityEventsRepository)
    {
        _universityEventsRepository = universityEventsRepository;
    }

    public async Task<List<UniversityEventDto>> Handle(GetUniversityEventsCommand request, CancellationToken cancellationToken)
    {
        var universityEvents = await _universityEventsRepository.Get(request.TagIds);

        return universityEvents.Select(x => new UniversityEventDto(
            x.Id,
            x.Title,
            x.Description,
            x.CreatorId,
            x.StartDateTime,
            x.EndDateTime,
            x.ParticipantsLimit,
            x.Tags.Select(tag => new TagDto(tag.Id, tag.Name)).ToList()))
            .ToList();
    }
}
