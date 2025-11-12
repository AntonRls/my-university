namespace HacatonMax.University.Admin.Domain;

public interface IUserRepository
{
    Task Save(User user);

    Task<List<User>> GetUserWhoWaitApprove();

    Task UpdateApproveStatusInUser(long userId, ApproveStatus status);
}
