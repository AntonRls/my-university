namespace HacatonMax.University.Events.Domain;

public class UniversityEventsTagDictionary
{
    public Guid TagId { get; set; }
    public long UniversityEventId { get; set; }

    public Tag Tag { get; set; }
    public UniversityEvent UniversityEvent { get; set; }
}
