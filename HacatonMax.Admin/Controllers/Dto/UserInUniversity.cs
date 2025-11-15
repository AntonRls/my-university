using HacatonMax.Admin.Domain;

namespace HacatonMax.Admin.Controllers.Dto;

public record UserInUniversity(long UserId, string UniversityTenantName, ApproveStatus ApproveStatus);
