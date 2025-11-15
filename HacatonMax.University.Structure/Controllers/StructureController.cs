using HacatonMax.University.Structure.Application.Commands.AddGroupMember;
using HacatonMax.University.Structure.Application.Commands.CreateFaculty;
using HacatonMax.University.Structure.Application.Commands.CreateGroup;
using HacatonMax.University.Structure.Application.Commands.CreateProgram;
using HacatonMax.University.Structure.Application.Commands.CreateProgramCourse;
using HacatonMax.University.Structure.Application.Queries.GetMyGroups;
using HacatonMax.University.Structure.Application.Queries.GetStructureTree;
using HacatonMax.University.Structure.Controllers.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.Structure.Controllers;

[ApiController]
[Route("structure")]
public class StructureController(IMediator mediator)
{
    [HttpGet("tree")]
    public Task<StructureTreeDto> GetStructureTree()
    {
        return mediator.Send(new GetStructureTreeQuery());
    }

    [HttpPost("faculties")]
    [Authorize]
    public Task<long> CreateFaculty([FromBody] CreateFacultyRequest request)
    {
        return mediator.Send(new CreateFacultyCommand(request.Name, request.Code));
    }

    [HttpPost("faculties/{facultyId:long}/programs")]
    [Authorize]
    public Task<long> CreateProgram([FromRoute] long facultyId, [FromBody] CreateProgramRequest request)
    {
        var command = new CreateProgramCommand(facultyId, request.Name, request.DegreeLevel);
        return mediator.Send(command);
    }

    [HttpPost("faculties/{facultyId:long}/programs/{programId:long}/courses")]
    [Authorize]
    public Task<long> CreateProgramCourse(
        [FromRoute] long facultyId,
        [FromRoute] long programId,
        [FromBody] CreateProgramCourseRequest request)
    {
        var command = new CreateProgramCourseCommand(facultyId, programId, request.CourseNumber, request.Title, request.Ects);
        return mediator.Send(command);
    }

    [HttpPost("faculties/{facultyId:long}/programs/{programId:long}/courses/{courseId:long}/groups")]
    [Authorize]
    public Task<long> CreateGroup(
        [FromRoute] long facultyId,
        [FromRoute] long programId,
        [FromRoute] long courseId,
        [FromBody] CreateGroupRequest request)
    {
        CustomGroupMetaPayload? meta = null;
        if (request.CustomMeta is not null)
        {
            meta = new CustomGroupMetaPayload(
                request.CustomMeta.CreatedByUserId,
                request.CustomMeta.CreatedByRole,
                request.CustomMeta.Visibility,
                request.CustomMeta.ModerationStatus);
        }

        var command = new CreateGroupCommand(
            facultyId,
            programId,
            courseId,
            request.Type,
            request.Label,
            request.Capacity,
            request.IsPrimaryAllowed,
            meta);
        return mediator.Send(command);
    }

    [HttpPost("groups/{groupId:long}/members")]
    [Authorize]
    public Task AddGroupMember([FromRoute] long groupId, [FromBody] AddGroupMemberRequest request)
    {
        var command = new AddGroupMemberCommand(groupId, request.StudentId, request.MembershipType);
        return mediator.Send(command);
    }

    [HttpGet("me/groups")]
    [Authorize]
    public Task<IReadOnlyCollection<UserGroupDto>> GetMyGroups()
    {
        return mediator.Send(new GetMyGroupsQuery());
    }
}
