namespace HacatonMax.University.Users.Domain;

public interface IUserRepository
{
    Task<User?> GetById(long id);

    Task<List<User>> GetByIds(List<long> ids);

    Task<User?> GetByUsername(string username);

    Task<List<User>> GetByUniversityId(long universityId);

    Task Save(User user);

    Task SaveRange(List<User> users);
}

