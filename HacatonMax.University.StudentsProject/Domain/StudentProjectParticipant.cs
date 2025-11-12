using HacatonMax.Common.Exceptions;

namespace HacatonMax.University.StudentsProject.Domain;

public class StudentProjectParticipant
{
    public StudentProjectParticipant(
        Guid id,
        Guid studentProjectId,
        long userId,
        StudentProjectParticipantStatus status,
        bool isCreator,
        DateTimeOffset createdAt,
        List<StudentProjectParticipantRole>? participantRoles = null)
    {
        Id = id;
        StudentProjectId = studentProjectId;
        UserId = userId;
        Status = status;
        IsCreator = isCreator;
        CreatedAt = createdAt;
        ParticipantRoles = participantRoles ?? new List<StudentProjectParticipantRole>();
    }

    public Guid Id { get; private set; }

    public Guid StudentProjectId { get; private set; }

    public StudentProject StudentProject { get; private set; } = null!;

    public long UserId { get; private set; }

    public StudentProjectParticipantStatus Status { get; private set; }

    public bool IsCreator { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public List<StudentProjectParticipantRole> ParticipantRoles { get; private set; }

    public void UpdateStatus(StudentProjectParticipantStatus status)
    {
        Status = status;
    }

    public void SetCreator(bool isCreator)
    {
        IsCreator = isCreator;
    }

    public void SetParticipantRoles(List<StudentProjectParticipantRole> roles)
    {
        if (roles.Count > 2)
        {
            throw new BadRequestException("Участник не может иметь больше двух ролей.");
        }

        ParticipantRoles.Clear();
        ParticipantRoles.AddRange(roles);
    }

    private StudentProjectParticipant()
    {
        ParticipantRoles = new List<StudentProjectParticipantRole>();
    }
}

