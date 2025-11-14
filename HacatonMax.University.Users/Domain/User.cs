using System.Linq;

namespace HacatonMax.University.Users.Domain;

public class User
{
    public User(
        long id,
        string firstName,
        string lastName,
        string? username = null,
        string? email = null)
    {
        Id = id;
        FirstName = firstName;
        LastName = lastName;
        Username = username;
        Email = email;
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public long Id { get; private set; }

    public string FirstName { get; private set; }

    public string LastName { get; private set; }

    public string? Username { get; private set; }

    public string? Email { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public List<UserUniversity> Universities { get; private set; } = new();

    public void UpdateProfile(string firstName, string lastName, string? username = null, string? email = null)
    {
        FirstName = firstName;
        LastName = lastName;
        Username = username;
        Email = email;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void AddUniversity(long universityId)
    {
        if (Universities.Any(u => u.UniversityId == universityId))
        {
            return; // Уже есть связь с этим вузом
        }

        Universities.Add(new UserUniversity(Id, universityId));
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RemoveUniversity(long universityId)
    {
        var userUniversity = Universities.FirstOrDefault(u => u.UniversityId == universityId);
        if (userUniversity != null)
        {
            Universities.Remove(userUniversity);
            UpdatedAt = DateTimeOffset.UtcNow;
        }
    }

    public bool HasAccessToUniversity(long universityId)
    {
        return Universities.Any(u => u.UniversityId == universityId);
    }

    private User()
    {
        FirstName = null!;
        LastName = null!;
        Universities = new List<UserUniversity>();
    }
}

