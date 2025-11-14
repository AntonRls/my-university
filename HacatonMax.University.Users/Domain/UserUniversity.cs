namespace HacatonMax.University.Users.Domain;

/// <summary>
/// Связь пользователя с университетом (tenant)
/// </summary>
public class UserUniversity
{
    public UserUniversity(long userId, long universityId)
    {
        UserId = userId;
        UniversityId = universityId;
        JoinedAt = DateTimeOffset.UtcNow;
    }

    public long UserId { get; private set; }

    public long UniversityId { get; private set; }

    public DateTimeOffset JoinedAt { get; private set; }

    public User User { get; private set; } = null!;

    private UserUniversity()
    {
    }
}

