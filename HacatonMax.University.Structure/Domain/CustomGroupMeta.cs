namespace HacatonMax.University.Structure.Domain;

public class CustomGroupMeta
{
    private CustomGroupMeta()
    {
    }

    private CustomGroupMeta(
        long? createdByUserId,
        CustomGroupCreatorRole createdByRole,
        CustomGroupVisibility visibility,
        CustomGroupModerationStatus moderationStatus)
    {
        CreatedByUserId = createdByUserId;
        CreatedByRole = createdByRole;
        Visibility = visibility;
        ModerationStatus = moderationStatus;
    }

    public long GroupId { get; private set; }

    public long? CreatedByUserId { get; private set; }

    public CustomGroupCreatorRole CreatedByRole { get; private set; }

    public CustomGroupVisibility Visibility { get; private set; }

    public CustomGroupModerationStatus ModerationStatus { get; private set; }

    public Group Group { get; private set; } = null!;

    public static CustomGroupMeta Create(
        long? createdByUserId,
        CustomGroupCreatorRole createdByRole,
        CustomGroupVisibility visibility,
        CustomGroupModerationStatus moderationStatus)
    {
        return new CustomGroupMeta(createdByUserId, createdByRole, visibility, moderationStatus);
    }
}
