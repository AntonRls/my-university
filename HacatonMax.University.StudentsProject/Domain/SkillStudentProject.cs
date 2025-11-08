namespace HacatonMax.University.StudentsProject.Domain;

public class SkillStudentProject
{
    public Guid SkillId { get; set; }
    public Guid StudentProjectId { get; set; }

    public StudentProject StudentProject { get; set; }

    public Skill Skill { get; set; }
}
