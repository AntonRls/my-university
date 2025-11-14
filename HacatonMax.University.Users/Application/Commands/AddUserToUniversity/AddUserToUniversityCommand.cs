using TimeWarp.Mediator;

namespace HacatonMax.University.Users.Application.Commands.AddUserToUniversity;

public record AddUserToUniversityCommand(long UserId, long UniversityId) : IRequest;

