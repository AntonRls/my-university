using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.Events.Application.Common;
using HacatonMax.University.Events.Controllers.Dto;
using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.SearchUniversityEvents;

public sealed class SearchUniversityEventsHandler : IRequestHandler<SearchUniversityEventsCommand, List<UniversityEventDto>>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;
    private readonly IUserContextService _userContextService;

    public SearchUniversityEventsHandler(
        IUniversityEventsRepository universityEventsRepository,
        IUserContextService userContextService)
    {
        _universityEventsRepository = universityEventsRepository;
        _userContextService = userContextService;
    }

    public async Task<List<UniversityEventDto>> Handle(SearchUniversityEventsCommand request, CancellationToken cancellationToken)
    {
        var query = request.Query?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(query))
        {
            throw new BadRequestException("Запрос для поиска не может быть пустым");
        }

        var universityEvents = await _universityEventsRepository.Search(query);
        var currentUser = _userContextService.GetCurrentUser();

        return UniversityEventMapper.ToDtoList(universityEvents, currentUser.Id);
    }
}

