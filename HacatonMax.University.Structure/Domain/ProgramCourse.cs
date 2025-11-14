namespace HacatonMax.University.Structure.Domain;

public class ProgramCourse
{
    private ProgramCourse()
    {
        Title = string.Empty;
        Groups = new List<Group>();
    }

    public ProgramCourse(long programId, int courseNumber, string title, int? ects)
    {
        if (courseNumber < 1 || courseNumber > 6)
        {
            throw new ArgumentOutOfRangeException(nameof(courseNumber), "Course number must be within 1..6");
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(title);

        ProgramId = programId;
        CourseNumber = courseNumber;
        Title = title;
        Ects = ects;
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = CreatedAt;
        Groups = new List<Group>();
    }

    public long Id { get; private set; }

    public long ProgramId { get; private set; }

    public int CourseNumber { get; private set; }

    public string Title { get; private set; }

    public int? Ects { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public DateTimeOffset? DeletedAt { get; private set; }

    public AcademicProgram Program { get; private set; } = null!;

    public ICollection<Group> Groups { get; private set; }

    public void UpdateTimestamp()
    {
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
