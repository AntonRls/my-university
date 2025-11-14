using HacatonMax.University.Admin.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Admin.Application.UpdateUserApproveStatus;

public record UpdateUserApproveStatusCommand(long UserId, ApproveStatus ApproveStatus) : UpdateUserApproveStatusBase(ApproveStatus), IRequest;

public record UpdateUserApproveStatusBase(ApproveStatus ApproveStatus) : IRequest;
