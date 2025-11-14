namespace HacatonMax.University.Structure.Domain;

public class AcademicProgram
{
    private AcademicProgram()
    {
        Name = string.Empty;
        DegreeLevel = string.Empty;
        Courses = new List<ProgramCourse>();
    }

    public AcademicProgram(long facultyId, string name, string degreeLevel)
    {
        FacultyId = facultyId;
        Name = name;
        DegreeLevel = degreeLevel;
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = CreatedAt;
        Courses = new List<ProgramCourse>();
    }

    public long Id { get; private set; }

    public long FacultyId { get; private set; }

    public string Name { get; private set; }

    public string DegreeLevel { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public DateTimeOffset? DeletedAt { get; private set; }

    public Faculty Faculty { get; private set; } = null!;

    public ICollection<ProgramCourse> Courses { get; private set; }

    public void UpdateTimestamp()
    {
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
