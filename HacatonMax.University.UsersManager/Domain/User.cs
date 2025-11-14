namespace HacatonMax.University.Admin.Domain;

public class User
{
    public long Id { get; private set; }

    public string FirstName { get; private set; }

    public string LastName { get; private set; }

    public string? Username { get; private set; }

    public UserRole Role { get; private set; }

    public ApproveStatus Status { get; private set; }

    public User(string firstName, string lastName, UserRole role, string? username)
    {
        FirstName = firstName;
        LastName = lastName;
        Role = role;
        Status = ApproveStatus.WaitApprove;
        Username = username;
    }

    public void UpdateStatus(ApproveStatus status)
    {
        Status = status;
    }

    private User()
    {
    }
}
