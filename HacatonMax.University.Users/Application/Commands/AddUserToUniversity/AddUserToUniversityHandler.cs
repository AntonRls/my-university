using HacatonMax.Common.Exceptions;
using HacatonMax.University.Users.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Users.Application.Commands.AddUserToUniversity;

public class AddUserToUniversityHandler : IRequestHandler<AddUserToUniversityCommand>
{
    private readonly IUserRepository _userRepository;

    public AddUserToUniversityHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task Handle(AddUserToUniversityCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetById(request.UserId);

        if (user == null)
        {
            throw new NotFoundException($"User with id {request.UserId} not found");
        }

        user.AddUniversity(request.UniversityId);

        await _userRepository.Save(user);
    }
}

