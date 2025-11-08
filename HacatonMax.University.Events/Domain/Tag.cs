namespace HacatonMax.University.Events.Domain;

public class Tag
{
    public Tag(Guid id, string name)
    {
        Id = id;
        Name = name;
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; }
}
