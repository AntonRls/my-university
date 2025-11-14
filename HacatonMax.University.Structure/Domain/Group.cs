namespace HacatonMax.University.Structure.Domain;

public class Group
{
    private Group()
    {
        Label = string.Empty;
        Members = new List<GroupMember>();
    }

    public Group(
        long programCourseId,
        GroupType type,
        string label,
        int capacity,
        bool isPrimaryAllowed)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(label);
        if (capacity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(capacity), "Capacity must be positive");
        }

        if (type == GroupType.Main && !isPrimaryAllowed)
        {
            throw new InvalidOperationException("Main groups must allow primary membership");
        }

        if (type == GroupType.CustomUser)
        {
            isPrimaryAllowed = false;
        }

        ProgramCourseId = programCourseId;
        Type = type;
        Label = label;
        Capacity = capacity;
        IsPrimaryAllowed = isPrimaryAllowed;
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = CreatedAt;
        Members = new List<GroupMember>();
    }

    public long Id { get; private set; }

    public long ProgramCourseId { get; private set; }

    public GroupType Type { get; private set; }

    public string Label { get; private set; }

    public int Capacity { get; private set; }

    public bool IsPrimaryAllowed { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public DateTimeOffset? DeletedAt { get; private set; }

    public ProgramCourse ProgramCourse { get; private set; } = null!;

    public CustomGroupMeta? CustomMeta { get; private set; }

    public ICollection<GroupMember> Members { get; private set; }

    public void AttachCustomMeta(CustomGroupMeta meta)
    {
        CustomMeta = meta;
    }

    public void UpdateTimestamp()
    {
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
