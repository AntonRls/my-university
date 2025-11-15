namespace HacatonMax.Admin.Domain;

public interface IUniversityRepository
{
    Task<List<University>> GetAll();

    Task Save(University university);

    Task<List<UserInUniversity>> GetUserUniversities(long userId);

    Task<bool> RemoveUserFromUniversity(long userId, long universityId);
}
