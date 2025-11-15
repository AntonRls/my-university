using HacatonMax.University.Admin.Domain;
using HacatonMax.University.Events.Controllers.Dto;
using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.GetEventRegistrations;

public class GetEventRegistrationsHandler : IRequestHandler<GetEventRegistrationsCommand, List<EventRegistrationDto>>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;
    private readonly IUserRepository _userRepository;

    public GetEventRegistrationsHandler(
        IUniversityEventsRepository universityEventsRepository,
        IUserRepository userRepository)
    {
        _universityEventsRepository = universityEventsRepository;
        _userRepository = userRepository;
    }

    public async Task<List<EventRegistrationDto>> Handle(GetEventRegistrationsCommand request, CancellationToken cancellationToken)
    {
        var registrations = await _universityEventsRepository.GetRegistrationsForEvent(request.EventId);
        
        if (registrations.Count == 0)
        {
            return new List<EventRegistrationDto>();
        }

        var userIds = registrations.Select(r => r.UserId).Distinct().ToList();
        var users = await _userRepository.GetUsersByIds(userIds.ToArray());
        var usersDict = users.ToDictionary(u => u.Id, u => u);

        return registrations.Select(registration =>
        {
            var user = usersDict.GetValueOrDefault(registration.UserId);
            return new EventRegistrationDto(
                registration.Id,
                registration.UserId,
                user?.FirstName ?? "Неизвестно",
                user?.LastName ?? "",
                user?.Username,
                registration.CreatedAt);
        }).ToList();
    }
}

