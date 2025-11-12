namespace HacatonMax.University.StudentsProject.Domain;

public class Skill
{
    public Skill(Guid id, string name)
    {
        Id = id;
        Name = name;
        StudentProjects = new List<StudentProject>();
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; } = null!;

    public List<StudentProject> StudentProjects { get; private set; } = new();

    // for ef core
    private Skill()
    {
        Name = null!;
        StudentProjects = new List<StudentProject>();
    }
}
