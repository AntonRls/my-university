using HacatonMax.University.Schedule.Domain;

namespace HacatonMax.University.Schedule.Application.Common;

public static class ScheduleDeliveryTypeParser
{
    public static ScheduleDeliveryType Parse(string? deliveryType)
    {
        if (Enum.TryParse(deliveryType, true, out ScheduleDeliveryType parsed))
        {
            return parsed;
        }

        throw new ArgumentException($"Unknown delivery type '{deliveryType}'", nameof(deliveryType));
    }
}

