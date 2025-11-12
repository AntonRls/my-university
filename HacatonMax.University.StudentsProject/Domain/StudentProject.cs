using System;
using System.Linq;
using HacatonMax.Common.Exceptions;

namespace HacatonMax.University.StudentsProject.Domain;

public class StudentProject
{
    public StudentProject(
        Guid id,
        string title,
        string description,
        long creatorId,
        List<Skill> needSkills,
        long? eventId = null)
    {
        Id = id;
        Title = title;
        Description = description;
        CreatorId = creatorId;
        NeedSkills = needSkills;
        EventId = eventId;
        Participants = new List<StudentProjectParticipant>();
    }

    public Guid Id { get; private set; }

    public string Title { get; private set; } = null!;

    public string Description { get; private set; } = null!;

    public long CreatorId { get; private set; }

    public List<Skill> NeedSkills { get; private set; }

    public long? EventId { get; private set; }

    public List<StudentProjectParticipant> Participants { get; private set; }

    public void UpdateNeedSkills(List<Skill> skills)
    {
        NeedSkills = skills;
    }

    public void UpdateEvent(long? eventId)
    {
        EventId = eventId;
    }

    public void UpdateDetails(string title, string description)
    {
        Title = title;
        Description = description;
    }

    public void AddParticipant(StudentProjectParticipant participant)
    {
        if (Participants.Any(existing => existing.UserId == participant.UserId))
        {
            throw new BadRequestException("Участник уже добавлен в проект.");
        }

        Participants.Add(participant);
    }

    public StudentProjectParticipant? FindParticipant(Guid participantId)
    {
        return Participants.FirstOrDefault(participant => participant.Id == participantId);
    }

    public StudentProjectParticipant? FindParticipantByUser(long userId)
    {
        return Participants.FirstOrDefault(participant => participant.UserId == userId);
    }

    public void RemoveParticipant(StudentProjectParticipant participant)
    {
        if (participant.IsCreator)
        {
            throw new BadRequestException("Нельзя удалить создателя проекта.");
        }

        Participants.Remove(participant);
    }

    private StudentProject()
    {
        Title = null!;
        Description = null!;
        Participants = new List<StudentProjectParticipant>();
        NeedSkills = new List<Skill>();
    }
}
