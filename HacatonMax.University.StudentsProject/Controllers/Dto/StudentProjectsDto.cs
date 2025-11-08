namespace HacatonMax.University.StudentsProject.Controllers.Dto;

public record StudentProjectsDto(Guid Id, string Title, string Description, List<SkillDto> NeedSkills);
