using HacatonMax.Common.Options;
using HacatonMax.University.Admin.Controllers.Dto;
using HacatonMax.University.Admin.Domain;
using Microsoft.Extensions.Options;
using TimeWarp.Mediator;

namespace HacatonMax.University.Admin.Application.GetUsersWhoWaitApprove;

public class GetUsersWhoWaitApproveHandler : IRequestHandler<GetUsersWhoWaitApproveCommand, List<UserDto>>
{
    private readonly IUserRepository _userRepository;
    private readonly IOptions<TenantSettings> _tenantSettings;

    public GetUsersWhoWaitApproveHandler(IUserRepository userRepository, IOptions<TenantSettings> tenantSettings)
    {
        _userRepository = userRepository;
        _tenantSettings = tenantSettings;
    }

    public async Task<List<UserDto>> Handle(GetUsersWhoWaitApproveCommand request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetUserWhoWaitApprove();

        return users
            .Select(x => new UserDto(x.Id, x.FirstName, x.LastName, x.Username, x.Role, _tenantSettings.Value.UniversityName))
            .ToList();
    }
}
