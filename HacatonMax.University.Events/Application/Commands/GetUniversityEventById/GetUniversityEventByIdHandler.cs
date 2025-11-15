using HacatonMax.Common.Exceptions;
using HacatonMax.University.Auth.Domain;
using HacatonMax.University.Events.Application.Common;
using HacatonMax.University.Events.Controllers.Dto;
using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.GetUniversityEventById;

public class GetUniversityEventByIdHandler : IRequestHandler<GetUniversityEventByIdCommand, UniversityEventDto>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;
    private readonly IUserContextService _userContextService;

    public GetUniversityEventByIdHandler(
        IUniversityEventsRepository universityEventsRepository,
        IUserContextService userContextService)
    {
        _universityEventsRepository = universityEventsRepository;
        _userContextService = userContextService;
    }

    public async Task<UniversityEventDto> Handle(GetUniversityEventByIdCommand request, CancellationToken cancellationToken)
    {
        var universityEvent = await _universityEventsRepository.GetById(request.Id);
        
        if (universityEvent == null)
        {
            throw new NotFoundException($"Событие с ID {request.Id} не найдено");
        }

        var currentUser = _userContextService.GetCurrentUser();
        return UniversityEventMapper.ToDto(universityEvent, currentUser.Id);
    }
}

