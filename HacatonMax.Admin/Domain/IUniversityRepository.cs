namespace HacatonMax.Admin.Domain;

public interface IUniversityRepository
{
    Task<List<University>> GetAll();

    Task Save(University university);
}
