using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Options;
using HacatonMax.University.Schedule.Application.Commands.UpsertPersonalSlot;
using HacatonMax.University.Schedule.Domain;
using HacatonMax.University.Schedule.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace HacatonMax.University.Schedule.Tests.Application;

public class UpsertPersonalSlotCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldCreatePersonalEntry_WhenEntryIdIsNull()
    {
        var dbContext = BuildDbContext();
        var userContext = new FakeUserContextService();
        var handler = new UpsertPersonalSlotCommandHandler(
            dbContext,
            userContext,
            Options.Create(new TenantSettings
            {
                TenantId = 9,
                TenantName = "cu",
                UniversityName = "Central U"
            }));

        var startsAt = DateTimeOffset.UtcNow.AddDays(1);
        var command = new UpsertPersonalSlotCommand(
            null,
            "Deep work",
            "Study session",
            "Self",
            ScheduleDeliveryType.Offline.ToString(),
            "Library room",
            null,
            startsAt,
            startsAt.AddHours(2));

        var entryId = await handler.Handle(command, CancellationToken.None);

        entryId.Should().BeGreaterThan(0);

        var entry = await dbContext.ScheduleEntries.SingleAsync();
        entry.Id.Should().Be(entryId);
        entry.OwnerUserId.Should().Be(userContext.GetCurrentUser().Id);
        entry.SourceType.Should().Be(ScheduleSource.ManualPersonal);
        entry.PhysicalLocation.Should().Be("Library room");
        entry.StartsAt.Should().Be(startsAt);
    }

    private static ScheduleDbContext BuildDbContext()
    {
        var options = new DbContextOptionsBuilder<ScheduleDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ScheduleDbContext(options);
    }

    private sealed class FakeUserContextService : IUserContextService
    {
        private readonly User _user = new(100, "Test", "User", "test.user");

        public User GetCurrentUser()
        {
            return _user;
        }

        public User? GetCurrentUserOrDefault()
        {
            return _user;
        }
    }
}

