namespace HacatonMax.University.Library.Domain;

public class Book
{
    public Book(string title, string? description, long count, long takeCount, List<Tag> tags)
    {
        Title = title;
        Description = description;
        Count = count;
        TakeCount = takeCount;
        Tags = tags;
    }

    public long Id { get; private set; }

    public string Title { get; private set; }

    public string? Description { get; private set; }

    public long Count { get; private set; }

    public long TakeCount { get; private set; }

    public List<Tag> Tags { get; private set; }

    private Book()
    {
    }
}
