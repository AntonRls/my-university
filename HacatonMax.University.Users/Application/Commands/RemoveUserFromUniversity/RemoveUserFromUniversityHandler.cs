using HacatonMax.Common.Exceptions;
using HacatonMax.University.Users.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Users.Application.Commands.RemoveUserFromUniversity;

public class RemoveUserFromUniversityHandler : IRequestHandler<RemoveUserFromUniversityCommand>
{
    private readonly IUserRepository _userRepository;

    public RemoveUserFromUniversityHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task Handle(RemoveUserFromUniversityCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetById(request.UserId);

        if (user == null)
        {
            throw new NotFoundException($"User with id {request.UserId} not found");
        }

        user.RemoveUniversity(request.UniversityId);

        await _userRepository.Save(user);
    }
}

