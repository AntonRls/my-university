namespace HacatonMax.University.StudentsProject.Domain;

public class StudentProjectParticipantRole
{
    public StudentProjectParticipantRole(Guid id, Guid participantId, Guid teamRoleId)
    {
        Id = id;
        ParticipantId = participantId;
        TeamRoleId = teamRoleId;
    }

    public Guid Id { get; private set; }

    public Guid ParticipantId { get; private set; }

    public StudentProjectParticipant Participant { get; private set; } = null!;

    public Guid TeamRoleId { get; private set; }

    public TeamRole TeamRole { get; private set; } = null!;

    private StudentProjectParticipantRole()
    {
    }
}

