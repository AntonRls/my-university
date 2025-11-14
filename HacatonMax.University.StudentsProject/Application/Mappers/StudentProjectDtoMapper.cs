using System.Collections.Generic;
using System.Linq;
using HacatonMax.University.StudentsProject.Controllers.Dto;
using HacatonMax.University.StudentsProject.Domain;

namespace HacatonMax.University.StudentsProject.Application.Mappers;

internal static class StudentProjectDtoMapper
{
    public static StudentProjectsDto ToDto(StudentProject project, StudentProjectEventDto? eventDto)
    {
        var skills = project.NeedSkills
            .Select(skill => new SkillDto(skill.Id, skill.Name))
            .ToList();

        var participants = project.Participants
            .Select(ToParticipantDto)
            .OrderByDescending(participant => participant.IsCreator)
            .ThenBy(participant => participant.CreatedAt)
            .ToList();

        return new StudentProjectsDto(
            project.Id,
            project.Title,
            project.Description,
            project.CreatorId,
            skills,
            eventDto,
            participants);
    }

    public static StudentProjectParticipantDto ToParticipantDto(StudentProjectParticipant participant)
    {
        var roles = participant.ParticipantRoles
            .Where(role => role.TeamRole != null)
            .Select(role => new TeamRoleDto(role.TeamRoleId, role.TeamRole!.Name, role.TeamRole.Description))
            .ToList();

        return new StudentProjectParticipantDto(
            participant.Id,
            participant.UserId,
            participant.Status,
            participant.IsCreator,
            participant.CreatedAt,
            roles);
    }
}

