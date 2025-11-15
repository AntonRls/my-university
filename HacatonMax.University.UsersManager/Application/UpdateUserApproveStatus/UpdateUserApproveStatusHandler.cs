using HacatonMax.Admin.Integration;
using HacatonMax.Common.Options;
using HacatonMax.University.Admin.Domain;
using Microsoft.Extensions.Options;
using TimeWarp.Mediator;

namespace HacatonMax.University.Admin.Application.UpdateUserApproveStatus;

public class UpdateUserApproveStatusHandler : IRequestHandler<UpdateUserApproveStatusCommand>
{
    private readonly IUserRepository _userRepository;
    private readonly AdminUniversitiesClient _adminUniversitiesClient;
    private readonly IOptions<TenantSettings> _tenantSettings;

    public UpdateUserApproveStatusHandler(IUserRepository userRepository, AdminUniversitiesClient  adminUniversitiesClient, IOptions<TenantSettings> tenantSettings)
    {
        _userRepository = userRepository;
        _adminUniversitiesClient = adminUniversitiesClient;
        _tenantSettings = tenantSettings;
    }

    public async Task Handle(UpdateUserApproveStatusCommand request, CancellationToken cancellationToken)
    {
        var convertedEnum = ConvertApproveStatusToIntegrationEnum(request.ApproveStatus);
        await _adminUniversitiesClient.UpdateStatusWithUser(request.UserId, _tenantSettings.Value.TenantId, convertedEnum);

        await _userRepository.UpdateApproveStatusInUser(request.UserId, request.ApproveStatus);
    }

    private HacatonMax.Admin.Integration.Models.ApproveStatus ConvertApproveStatusToIntegrationEnum(
        ApproveStatus approveStatus)
    {
        if (approveStatus == ApproveStatus.WaitApprove)
        {
            return HacatonMax.Admin.Integration.Models.ApproveStatus.Wait;
        }

        if (approveStatus == ApproveStatus.Approved)
        {
            return HacatonMax.Admin.Integration.Models.ApproveStatus.Approved;
        }

        if (approveStatus == ApproveStatus.Rejected)
        {
            return HacatonMax.Admin.Integration.Models.ApproveStatus.Rejected;
        }

        return HacatonMax.Admin.Integration.Models.ApproveStatus.Wait;
    }
}
