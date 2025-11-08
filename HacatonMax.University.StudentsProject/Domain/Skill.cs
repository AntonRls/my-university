namespace HacatonMax.University.StudentsProject.Domain;

public class Skill
{
    public Skill(Guid id, string name)
    {
        Id = id;
        Name = name;
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; }

    public List<StudentProject> StudentProjects {get; private set; }

    // for ef core
    private Skill()
    {
    }
}
