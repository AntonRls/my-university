using HacatonMax.University.Admin.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Admin.Application.EnjoyToUniversity;

public record EnjoyToUniversityCommand(UserRole Role) : IRequest;
