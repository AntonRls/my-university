using System;
using FluentAssertions;
using HacatonMax.University.Schedule.Domain;

namespace HacatonMax.University.Schedule.Tests.Domain;

public class ScheduleEntryTests
{
    [Fact]
    public void OfflineEntry_ShouldRequirePhysicalLocation()
    {
        var act = () => new ScheduleEntry(
            tenantId: 1,
            title: "Math",
            description: null,
            teacher: "Dr. Euler",
            physicalLocation: null,
            onlineLink: null,
            startsAt: DateTimeOffset.UtcNow,
            endsAt: DateTimeOffset.UtcNow.AddHours(1),
            deliveryType: ScheduleDeliveryType.Offline,
            sourceType: ScheduleSource.AdminLesson,
            createdByUserId: 42,
            groupId: 10);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*Physical location*");
    }

    [Fact]
    public void OnlineEntry_ShouldRequireOnlineLink()
    {
        var act = () => new ScheduleEntry(
            tenantId: 1,
            title: "Webinar",
            description: null,
            teacher: "Mentor",
            physicalLocation: "room",
            onlineLink: null,
            startsAt: DateTimeOffset.UtcNow,
            endsAt: DateTimeOffset.UtcNow.AddHours(1),
            deliveryType: ScheduleDeliveryType.Online,
            sourceType: ScheduleSource.UniversityEvent,
            createdByUserId: 42,
            groupId: null,
            ownerUserId: null,
            sourceEntityId: 5);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*Online link*");
    }

    [Fact]
    public void UpdateDetails_ShouldOverwriteFields()
    {
        var entry = new ScheduleEntry(
            tenantId: 1,
            title: "Math",
            description: "Calculus",
            teacher: "Dr. Euler",
            physicalLocation: "Room 201",
            onlineLink: null,
            startsAt: DateTimeOffset.UtcNow,
            endsAt: DateTimeOffset.UtcNow.AddHours(1),
            deliveryType: ScheduleDeliveryType.Offline,
            sourceType: ScheduleSource.AdminLesson,
            createdByUserId: 42,
            groupId: 10);

        var newStarts = DateTimeOffset.UtcNow.AddDays(1);
        entry.UpdateDetails(
            "Physics",
            "Optics",
            "Dr. Newton",
            "Room 203",
            null,
            newStarts,
            newStarts.AddHours(2),
            ScheduleDeliveryType.Offline);

        entry.Title.Should().Be("Physics");
        entry.Description.Should().Be("Optics");
        entry.Teacher.Should().Be("Dr. Newton");
        entry.PhysicalLocation.Should().Be("Room 203");
        entry.StartsAt.Should().Be(newStarts);
        entry.EndsAt.Should().Be(newStarts.AddHours(2));
    }
}

