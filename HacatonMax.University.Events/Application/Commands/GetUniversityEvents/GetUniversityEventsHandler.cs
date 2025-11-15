using HacatonMax.Common.AuthHelper;
using HacatonMax.University.Events.Application.Common;
using HacatonMax.University.Events.Controllers.Dto;
using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.GetUniversityEvents;

public class GetUniversityEventsHandler : IRequestHandler<GetUniversityEventsCommand, List<UniversityEventDto>>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;
    private readonly IUserContextService _userContextService;

    public GetUniversityEventsHandler(
        IUniversityEventsRepository universityEventsRepository,
        IUserContextService userContextService)
    {
        _universityEventsRepository = universityEventsRepository;
        _userContextService = userContextService;
    }

    public async Task<List<UniversityEventDto>> Handle(GetUniversityEventsCommand request, CancellationToken cancellationToken)
    {
        var universityEvents = await _universityEventsRepository.Get(request.TagIds);
        var currentUser = _userContextService.GetCurrentUser();

        return UniversityEventMapper.ToDtoList(universityEvents, currentUser.Id);
    }
}
