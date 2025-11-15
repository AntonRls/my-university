namespace HacatonMax.Admin.Domain;

public class UserInUniversity
{
    public UserInUniversity(long userId, string universityTenantName, long universityId)
    {
        UserId = userId;
        UniversityName = universityTenantName;
        UniversityId = universityId;
        ApproveStatus = ApproveStatus.Wait;
    }

    public long UserId { get; private set; }

    public string UniversityName { get; private set; }

    public long UniversityId { get; private set; }

    public ApproveStatus ApproveStatus { get; private set; }

    private UserInUniversity()
    {
    }
}
