namespace HacatonMax.University.Structure.Domain;

public class GroupMember
{
    private GroupMember()
    {
    }

    private GroupMember(long groupId, long tenantId, long studentId, GroupMembershipType membershipType)
    {
        GroupId = groupId;
        TenantId = tenantId;
        StudentId = studentId;
        MembershipType = membershipType;
        JoinedAt = DateTimeOffset.UtcNow;
    }

    public long GroupId { get; private set; }

    public long TenantId { get; private set; }

    public long StudentId { get; private set; }

    public GroupMembershipType MembershipType { get; private set; }

    public DateTimeOffset JoinedAt { get; private set; }

    public Group Group { get; private set; } = null!;

    public static GroupMember Create(long groupId, long tenantId, long studentId, GroupMembershipType membershipType)
    {
        return new GroupMember(groupId, tenantId, studentId, membershipType);
    }
}
