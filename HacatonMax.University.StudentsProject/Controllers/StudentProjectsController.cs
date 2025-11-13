using System;
using System.Collections.Generic;
using System.Linq;
using HacatonMax.University.StudentsProject.Application.Commands.ApproveStudentProjectParticipant;
using HacatonMax.University.StudentsProject.Application.Commands.CreateStudentProjects;
using HacatonMax.University.StudentsProject.Application.Commands.CreateTeamRole;
using HacatonMax.University.StudentsProject.Application.Commands.GetAllSkills;
using HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjects;
using HacatonMax.University.StudentsProject.Application.Commands.GetTeamRoles;
using HacatonMax.University.StudentsProject.Application.Commands.RemoveStudentProjectParticipant;
using HacatonMax.University.StudentsProject.Application.Commands.RequestStudentProjectParticipation;
using HacatonMax.University.StudentsProject.Application.Commands.RejectStudentProjectParticipant;
using HacatonMax.University.StudentsProject.Application.Commands.UpdateStudentProject;
using HacatonMax.University.StudentsProject.Application.Commands.UpdateStudentProjectParticipantRoles;
using HacatonMax.University.StudentsProject.Application.Common;
using HacatonMax.University.StudentsProject.Controllers.Dto;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Controllers;

[ApiController]
[Route("student-projects")]
public class StudentProjectsController(IMediator mediator)
{
    [HttpGet]
    public Task<List<StudentProjectsDto>> GetStudentProjects([FromQuery] GetStudentProjectsCommand command)
    {
        return mediator.Send(command);
    }

    [HttpPost]
    // TODO: Раскомментировать проверку авторизации после настройки получения токена
    // [Authorize]
    public Task<StudentProjectsDto> CrateStudentProject([FromBody] CreateStudentProjectRequest request)
    {
        var command = new CreateStudentProjectsCommand(
            request.Title,
            request.Description,
            request.NeedSkills,
            request.EventId);
        return mediator.Send(command);
    }

    [HttpPut("{projectId:guid}")]
    // TODO: Раскомментировать проверку авторизации после настройки получения токена
    // [Authorize]
    public Task<StudentProjectsDto> UpdateStudentProject([FromRoute] Guid projectId, [FromBody] UpdateStudentProjectRequest request)
    {
        var command = new UpdateStudentProjectCommand(
            projectId,
            request.Title,
            request.Description,
            request.NeedSkills,
            request.EventId);

        return mediator.Send(command);
    }

    [HttpPost("{projectId:guid}/participants/requests")]
    // TODO: Раскомментировать проверку авторизации после настройки получения токена
    // [Authorize]
    public Task RequestParticipation([FromRoute] Guid projectId, [FromBody] RequestStudentProjectParticipationRequest request)
    {
        var command = new RequestStudentProjectParticipationCommand(
            projectId,
            request?.RoleIds,
            MapNewRoles(request?.NewRoles));
        return mediator.Send(command);
    }

    [HttpPost("{projectId:guid}/participants/{participantId:guid}/approve")]
    // TODO: Раскомментировать проверку авторизации после настройки получения токена
    // [Authorize]
    public Task ApproveParticipant([FromRoute] Guid projectId, [FromRoute] Guid participantId, [FromBody] ApproveStudentProjectParticipantRequest request)
    {
        var command = new ApproveStudentProjectParticipantCommand(
            projectId,
            participantId,
            request?.RoleIds,
            MapNewRoles(request?.NewRoles));
        return mediator.Send(command);
    }

    [HttpPost("{projectId:guid}/participants/{participantId:guid}/reject")]
    // TODO: Раскомментировать проверку авторизации после настройки получения токена
    // [Authorize]
    public Task RejectParticipant([FromRoute] Guid projectId, [FromRoute] Guid participantId)
    {
        var command = new RejectStudentProjectParticipantCommand(projectId, participantId);
        return mediator.Send(command);
    }

    [HttpPut("{projectId:guid}/participants/{participantId:guid}/roles")]
    // TODO: Раскомментировать проверку авторизации после настройки получения токена
    // [Authorize]
    public Task UpdateParticipantRoles([FromRoute] Guid projectId, [FromRoute] Guid participantId, [FromBody] UpdateParticipantRolesRequest request)
    {
        var command = new UpdateStudentProjectParticipantRolesCommand(
            projectId,
            participantId,
            request.RoleIds,
            MapNewRoles(request.NewRoles));
        return mediator.Send(command);
    }

    [HttpDelete("{projectId:guid}/participants/{participantId:guid}")]
    // TODO: Раскомментировать проверку авторизации после настройки получения токена
    // [Authorize]
    public Task RemoveParticipant([FromRoute] Guid projectId, [FromRoute] Guid participantId)
    {
        var command = new RemoveStudentProjectParticipantCommand(projectId, participantId);
        return mediator.Send(command);
    }

    [HttpGet("skills")]
    public Task<List<SkillDto>> GetAllSkills()
    {
        return mediator.Send(new GetAllSkillsCommand());
    }

    [HttpGet("team-roles")]
    public Task<List<TeamRoleDto>> GetTeamRoles()
    {
        return mediator.Send(new GetTeamRolesCommand());
    }

    [HttpPost("team-roles")]
    // TODO: Раскомментировать проверку авторизации после настройки получения токена
    // [Authorize]
    public Task<TeamRoleDto> CreateTeamRole([FromBody] CreateTeamRoleRequest request)
    {
        var command = new CreateTeamRoleCommand(request.Name, request.Description);
        return mediator.Send(command);
    }

    private static List<NewTeamRoleInput>? MapNewRoles(List<CreateTeamRoleRequest>? newRoles)
    {
        return newRoles?
            .Where(role => !string.IsNullOrWhiteSpace(role.Name))
            .Select(role => new NewTeamRoleInput(role.Name.Trim(), role.Description?.Trim()))
            .ToList();
    }
}
