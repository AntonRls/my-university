using HacatonMax.University.Admin.Application.EnjoyToUniversity;
using HacatonMax.University.Admin.Application.GetUsersWhoWaitApprove;
using HacatonMax.University.Admin.Application.UpdateUserApproveStatus;
using HacatonMax.University.Admin.Controllers.Dto;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.Admin.Controllers;

[ApiController]
[Route("admin")]
public class AdminController(IMediator mediator)
{
    /// <summary>
    /// Запросить присоединение к ВУЗу
    /// </summary>
    [HttpPost("incoming-students-queue")]
    public Task PostIncomingStudentsQueue([FromBody] EnjoyToUniversityCommand command)
    {
        return mediator.Send(command);
    }

    /// <summary>
    /// Получить людей, которые ждут рассмотрение на вступление в ВУХ
    /// </summary>
    [HttpGet("incoming-students-queue")]
    public Task<List<UserDto>> GetIncomingStudentsQueue()
    {
        return mediator.Send(new GetUsersWhoWaitApproveCommand());
    }

    /// <summary>
    /// Обновить статус аппрува у пользователя (approved/rejected)
    /// </summary>
    [HttpPut("incoming-students-queue/{studentId:long}")]
    public async Task UpdateApproveStatusInStudent(long studentId, [FromBody] UpdateUserApproveStatusBase data)
    {
        await mediator.Send(new UpdateUserApproveStatusCommand(studentId, data.ApproveStatus));
    }
}
