namespace HacatonMax.University.StudentsProject.Controllers.Dto;

public record StudentProjectsDto(
    Guid Id,
    string Title,
    string Description,
    long CreatorId,
    List<SkillDto> NeedSkills,
    StudentProjectEventDto? Event,
    List<StudentProjectParticipantDto> Participants);
