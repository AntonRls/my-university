using HacatonMax.University.Events.Application.Commands.GetUniversityEvents;
using HacatonMax.University.Events.Controllers.Dto;
using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.GetUniversityEventTags;

public class GetUniversityEventTagsHandler : IRequestHandler<GetUniversityEventTagsCommand, List<TagDto>>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;

    public GetUniversityEventTagsHandler(IUniversityEventsRepository  universityEventsRepository)
    {
        _universityEventsRepository = universityEventsRepository;
    }

    public async Task<List<TagDto>> Handle(GetUniversityEventTagsCommand request, CancellationToken cancellationToken)
    {
        var tags = await _universityEventsRepository.GetTags();
        return tags.Select(x => new TagDto(x.Id, x.Name)).ToList();
    }
}
