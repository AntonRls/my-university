namespace HacatonMax.University.StudentsProject.Domain;

public class TeamRole
{
    public TeamRole(Guid id, string name, string? description = null)
    {
        Id = id;
        Name = name;
        Description = description;
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; } = null!;

    public string? Description { get; private set; }

    private TeamRole()
    {
    }
}

