namespace HacatonMax.University.Structure.Domain;

public class GroupMember
{
    private GroupMember()
    {
    }

    public GroupMember(long groupId, long studentId, GroupMembershipType membershipType)
    {
        GroupId = groupId;
        StudentId = studentId;
        MembershipType = membershipType;
        JoinedAt = DateTimeOffset.UtcNow;
    }

    public long GroupId { get; private set; }

    public long StudentId { get; private set; }

    public GroupMembershipType MembershipType { get; private set; }

    public DateTimeOffset JoinedAt { get; private set; }

    public Group Group { get; private set; } = null!;
}
