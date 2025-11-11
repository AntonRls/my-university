using HacatonMax.Admin.Controllers.Dto;
using HacatonMax.Admin.Domain;
using Microsoft.AspNetCore.Mvc;

namespace HacatonMax.Admin.Controllers;

[ApiController]
[Route("universities")]
public class UniversityController
{
    private readonly IUniversityRepository _universityRepository;

    public UniversityController(IUniversityRepository universityRepository)
    {
        _universityRepository = universityRepository;
    }

    [HttpGet]
    public async Task<List<UniversityDto>> GetAllUniversities()
    {
        var universities = await _universityRepository.GetAll();
        return universities.Select(x => new UniversityDto(x.Id, x.Name, x.TenantName)).ToList();
    }

    [HttpPost]
    public async Task CreateUniversity([FromBody] CreateUniversityDto university)
    {
        await _universityRepository.Save(new University(university.Name, university.TenantName));
    }

}
