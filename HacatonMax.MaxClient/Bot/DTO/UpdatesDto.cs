namespace HacatonMax.MaxClient.Bot.DTO;

public class UpdatesDto
{
    public IReadOnlyCollection<UpdateDto> Updates { get; set; }

    public long Marker { get; set; }
}
