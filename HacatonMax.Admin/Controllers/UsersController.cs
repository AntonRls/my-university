using HacatonMax.Admin.Domain;
using Microsoft.AspNetCore.Mvc;
using UserInUniversity = HacatonMax.Admin.Controllers.Dto.UserInUniversity;

namespace HacatonMax.Admin.Controllers;

[ApiController]
[Route("users")]
public class UsersController
{
    private readonly IUniversityRepository _universityRepository;
    private readonly IUserContextService _userContextService;

    public UsersController(IUniversityRepository universityRepository, IUserContextService userContextService)
    {
        _universityRepository = universityRepository;
        _userContextService = userContextService;
    }

    [HttpGet("me")]
    public async Task<List<UserInUniversity>> GetUsersInUniversity()
    {
        var userUniversities = await _universityRepository.GetUserUniversities(_userContextService.GetCurrentUser().Id);
        return userUniversities.Select(x => new UserInUniversity(x.UserId, x.UniversityName, x.ApproveStatus)).ToList();
    }

    [HttpDelete("{userId:long}/universities/{universityId:long}")]
    public async Task<IActionResult> RemoveUserFromUniversity(long userId, long universityId)
    {
        _userContextService.GetCurrentUser();

        var removed = await _universityRepository.RemoveUserFromUniversity(userId, universityId);

        if (!removed)
        {
            return new NotFoundResult();
        }

        return new NoContentResult();
    }
}
