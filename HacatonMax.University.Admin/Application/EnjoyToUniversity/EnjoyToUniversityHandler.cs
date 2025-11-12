using HacatonMax.University.Admin.Domain;
using HacatonMax.University.Auth.Domain;
using TimeWarp.Mediator;
using User = HacatonMax.University.Admin.Domain.User;

namespace HacatonMax.University.Admin.Application.EnjoyToUniversity;

public class EnjoyToUniversityHandler : IRequestHandler<EnjoyToUniversityCommand>
{
    private readonly IUserRepository _userRepository;
    private readonly IUserContextService _userContextService;

    public EnjoyToUniversityHandler(IUserRepository  userRepository, IUserContextService userContextService)
    {
        _userRepository = userRepository;
        _userContextService = userContextService;
    }

    public async Task Handle(EnjoyToUniversityCommand request, CancellationToken cancellationToken)
    {
        var user = _userContextService.GetCurrentUser();

        var enjoyInfoUser = new User(user.FirstName, user.LastName, request.Role, user.Username);
        await _userRepository.Save(enjoyInfoUser);
    }
}
