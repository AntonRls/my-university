using HacatonMax.University.Admin.Application.GetUsersWhoWaitApprove;
using HacatonMax.University.Admin.Controllers.Dto;
using HacatonMax.University.Admin.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Admin.Application.UpdateUserApproveStatus;

public class UpdateUserApproveStatusHandler : IRequestHandler<UpdateUserApproveStatusCommand>
{
    private readonly IUserRepository _userRepository;

    public UpdateUserApproveStatusHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public Task Handle(UpdateUserApproveStatusCommand request, CancellationToken cancellationToken)
    {
        return _userRepository.UpdateApproveStatusInUser(request.UserId, request.ApproveStatus);
    }
}
