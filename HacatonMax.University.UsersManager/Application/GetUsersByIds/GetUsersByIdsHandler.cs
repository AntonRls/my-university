using HacatonMax.Common.Options;
using HacatonMax.University.Admin.Controllers.Dto;
using HacatonMax.University.Admin.Domain;
using Microsoft.Extensions.Options;
using TimeWarp.Mediator;

namespace HacatonMax.University.Admin.Application.GetUsersByIds;

public class GetUsersByIdsHandler : IRequestHandler<GetUsersByIdsCommand, List<UserDto>>
{
    private readonly IUserRepository _repository;
    private readonly IOptions<TenantSettings> _tenantSettings;

    public GetUsersByIdsHandler(IUserRepository repository, IOptions<TenantSettings> tenantSettings)
    {
        _repository = repository;
        _tenantSettings = tenantSettings;
    }

    public async Task<List<UserDto>> Handle(GetUsersByIdsCommand request, CancellationToken cancellationToken)
    {
        var users = await _repository.GetUsersByIds(request.UserIds);

        return users.Select(x => new UserDto(x.Id, x.FirstName, x.LastName, x.Username, x.Role, _tenantSettings.Value.UniversityName)).ToList();
    }
}
