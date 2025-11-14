namespace HacatonMax.University.Structure.Domain;

public class Faculty
{
    private Faculty()
    {
        Name = string.Empty;
        Code = string.Empty;
        Programs = new List<AcademicProgram>();
    }

    public Faculty(string name, string code)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(code);

        Name = name;
        Code = code;
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = CreatedAt;
        Programs = new List<AcademicProgram>();
    }

    public long Id { get; private set; }

    public string Name { get; private set; }

    public string Code { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public DateTimeOffset? DeletedAt { get; private set; }

    public ICollection<AcademicProgram> Programs { get; private set; }

    public void UpdateTimestamp()
    {
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
