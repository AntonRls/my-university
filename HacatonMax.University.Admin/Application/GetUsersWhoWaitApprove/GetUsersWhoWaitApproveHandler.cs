using HacatonMax.University.Admin.Controllers.Dto;
using HacatonMax.University.Admin.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Admin.Application.GetUsersWhoWaitApprove;

public class GetUsersWhoWaitApproveHandler : IRequestHandler<GetUsersWhoWaitApproveCommand, List<UserDto>>
{
    private readonly IUserRepository _userRepository;

    public GetUsersWhoWaitApproveHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<List<UserDto>> Handle(GetUsersWhoWaitApproveCommand request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetUserWhoWaitApprove();

        return users
            .Select(x => new UserDto(x.Id, x.FirstName, x.LastName, x.Username, x.Role))
            .ToList();
    }
}
