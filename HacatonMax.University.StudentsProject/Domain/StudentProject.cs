namespace HacatonMax.University.StudentsProject.Domain;

public class StudentProject
{
    public StudentProject(
        Guid id,
        string title,
        string description,
        List<Skill> needSkills,
        long? eventId = null)
    {
        Id = id;
        Title = title;
        Description = description;
        NeedSkills = needSkills;
        EventId = eventId;
    }

    public Guid Id { get; private set; }

    public string Title { get; private set; }

    public string Description { get; private set; }

    public List<Skill> NeedSkills { get; private set; }

    public long? EventId { get; private set; }

    public void UpdateNeedSkills(List<Skill> skills)
    {
        NeedSkills = skills;
    }

    public void UpdateEvent(long? eventId)
    {
        EventId = eventId;
    }

    private StudentProject()
    {
    }
}
