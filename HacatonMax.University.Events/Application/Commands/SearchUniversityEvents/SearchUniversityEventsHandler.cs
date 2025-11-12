using HacatonMax.Common.Exceptions;
using HacatonMax.University.Events.Controllers.Dto;
using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.SearchUniversityEvents;

public sealed class SearchUniversityEventsHandler : IRequestHandler<SearchUniversityEventsCommand, List<UniversityEventDto>>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;

    public SearchUniversityEventsHandler(IUniversityEventsRepository universityEventsRepository)
    {
        _universityEventsRepository = universityEventsRepository;
    }

    public async Task<List<UniversityEventDto>> Handle(SearchUniversityEventsCommand request, CancellationToken cancellationToken)
    {
        var query = request.Query?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(query))
        {
            throw new BadRequestException("Запрос для поиска не может быть пустым");
        }

        var universityEvents = await _universityEventsRepository.Search(query);

        return universityEvents
            .Select(x => new UniversityEventDto(
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

