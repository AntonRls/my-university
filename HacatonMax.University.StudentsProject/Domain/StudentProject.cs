namespace HacatonMax.University.StudentsProject.Domain;

public class StudentProject
{
    public StudentProject(Guid id, string title, string description, List<Skill> needSkills)
    {
        Id = id;
        Title = title;
        Description = description;
        NeedSkills = needSkills;
    }

    public Guid Id { get; private set; }

    public string Title { get; private set; }

    public string Description { get; private set; }

    public List<Skill> NeedSkills { get; private set; }

    public void UpdateNeedSkills(List<Skill> skills)
    {
        NeedSkills = skills;
    }

    private StudentProject()
    {
    }
}
