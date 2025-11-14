using TimeWarp.Mediator;

namespace HacatonMax.University.Users.Application.Commands.RemoveUserFromUniversity;

public record RemoveUserFromUniversityCommand(long UserId, long UniversityId) : IRequest;

