using HacatonMax.University.Users.Controllers.Dto;
using HacatonMax.University.Users.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Users.Application.Commands.GetUserById;

public class GetUserByIdHandler : IRequestHandler<GetUserByIdCommand, UserDto?>
{
    private readonly IUserRepository _userRepository;

    public GetUserByIdHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<UserDto?> Handle(GetUserByIdCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetById(request.Id);

        if (user == null)
        {
            return null;
        }

        return new UserDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Username,
            user.Email,
            user.Universities.Select(uu => uu.UniversityId).ToList());
    }
}

