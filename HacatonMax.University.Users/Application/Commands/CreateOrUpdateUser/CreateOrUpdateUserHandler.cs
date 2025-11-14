using HacatonMax.University.Users.Controllers.Dto;
using HacatonMax.University.Users.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Users.Application.Commands.CreateOrUpdateUser;

public class CreateOrUpdateUserHandler : IRequestHandler<CreateOrUpdateUserCommand, SimpleUserDto>
{
    private readonly IUserRepository _userRepository;

    public CreateOrUpdateUserHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<SimpleUserDto> Handle(CreateOrUpdateUserCommand request, CancellationToken cancellationToken)
    {
        var existingUser = await _userRepository.GetById(request.Id);

        User user;

        if (existingUser != null)
        {
            existingUser.UpdateProfile(request.FirstName, request.LastName, request.Username, request.Email);
            user = existingUser;
        }
        else
        {
            user = new User(
                request.Id,
                request.FirstName,
                request.LastName,
                request.Username,
                request.Email);
        }

        await _userRepository.Save(user);

        return new SimpleUserDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Username,
            user.Email,
            user.Universities.Select(uu => uu.UniversityId).ToList());
    }
}

