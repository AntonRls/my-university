namespace HacatonMax.Bot.Domain;

public interface IBotProvider
{
    /// <summary>
    /// Получает последнии события, которые произошли в боте
    /// </summary>
    Task<IReadOnlyCollection<UpdateEvent>> ReceiveUpdates();

    /// <summary>
    /// Отправляет сообщение
    /// </summary>
    Task SendMessage(Message message);
}
