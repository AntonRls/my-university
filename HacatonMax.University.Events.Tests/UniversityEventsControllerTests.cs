using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.Auth.Domain;
using HacatonMax.University.Events.Application.Commands.CreateUniversityEvent;
using HacatonMax.University.Events.Application.Commands.DeleteUniversityEvent;
using HacatonMax.University.Events.Application.Commands.GetUniversityEventById;
using HacatonMax.University.Events.Application.Commands.GetUniversityEvents;
using HacatonMax.University.Events.Application.Commands.GetUniversityEventTags;
using HacatonMax.University.Events.Application.Commands.RegisterForUniversityEvent;
using HacatonMax.University.Events.Application.Commands.SearchUniversityEvents;
using HacatonMax.University.Events.Application.Commands.UnregisterFromUniversityEvent;
using HacatonMax.University.Events.Application.Commands.UpdateUniversityEvent;
using HacatonMax.University.Events.Application.Services;
using HacatonMax.University.Events.Controllers.Dto;
using HacatonMax.University.Events.Domain;
using HacatonMax.University.Events.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HacatonMax.University.Events.Tests;

public class UniversityEventsControllerTests : IDisposable
{
    private readonly UniversityEventsDbContext _context;
    private readonly IUniversityEventsRepository _repository;

    public UniversityEventsControllerTests()
    {
        var options = new DbContextOptionsBuilder<UniversityEventsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new UniversityEventsDbContext(options);
        _repository = new TestUniversityEventsRepository(_context);
    }

    #region CreateUniversityEvent Tests

    [Fact]
    public async Task CreateUniversityEvent_ShouldCreateEvent()
    {
        // Arrange
        var creatorId = 1L;
        var startDateTime = DateTimeOffset.UtcNow.AddDays(7);
        var endDateTime = startDateTime.AddHours(2);
        var tags = new List<TagDto>
        {
            new TagDto(Guid.NewGuid(), "Technology"),
            new TagDto(Guid.NewGuid(), "Education")
        };

        var command = new CreateUniversityEventCommand(
            "Test Event",
            "Test Description",
            "Test Location",
            50,
            startDateTime,
            endDateTime,
            tags);

        var handler = new CreateUniversityEventHandler(
            _repository,
            new TestUserContextService(creatorId));

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var events = await _repository.Get(null);
        events.Should().ContainSingle(e => e.Title == "Test Event");
        var createdEvent = events.First(e => e.Title == "Test Event");
        createdEvent.Description.Should().Be("Test Description");
        createdEvent.Location.Should().Be("Test Location");
        createdEvent.CreatorId.Should().Be(creatorId);
        createdEvent.ParticipantsLimit.Should().Be(50);
        createdEvent.Tags.Should().HaveCount(2);
    }

    [Fact]
    public async Task CreateUniversityEvent_WithExistingTags_ShouldReuseTags()
    {
        // Arrange
        var creatorId = 1L;
        var existingTagId = Guid.NewGuid();
        var existingTag = new Tag(existingTagId, "Existing Tag");
        await _context.Tags.AddAsync(existingTag);
        await _context.SaveChangesAsync();

        var newTagId = Guid.NewGuid();
        var tags = new List<TagDto>
        {
            new TagDto(existingTagId, "Existing Tag"),
            new TagDto(newTagId, "New Tag")
        };

        var command = new CreateUniversityEventCommand(
            "Test Event",
            "Description",
            "Location",
            null,
            DateTimeOffset.UtcNow.AddDays(1),
            DateTimeOffset.UtcNow.AddDays(1).AddHours(2),
            tags);

        var handler = new CreateUniversityEventHandler(
            _repository,
            new TestUserContextService(creatorId));

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var allTags = await _repository.GetTags();
        allTags.Should().Contain(t => t.Id == existingTagId);
        allTags.Should().Contain(t => t.Id == newTagId);
        
        var events = await _repository.Get(null);
        var createdEvent = events.First(e => e.Title == "Test Event");
        createdEvent.Tags.Should().HaveCount(2);
        createdEvent.Tags.Should().Contain(t => t.Id == existingTagId);
        createdEvent.Tags.Should().Contain(t => t.Id == newTagId);
    }

    [Fact]
    public async Task CreateUniversityEvent_WithoutParticipantsLimit_ShouldCreateEvent()
    {
        // Arrange
        var creatorId = 1L;
        var command = new CreateUniversityEventCommand(
            "Unlimited Event",
            "Description",
            "Location",
            null,
            DateTimeOffset.UtcNow.AddDays(1),
            DateTimeOffset.UtcNow.AddDays(1).AddHours(2),
            new List<TagDto>());

        var handler = new CreateUniversityEventHandler(
            _repository,
            new TestUserContextService(creatorId));

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var events = await _repository.Get(null);
        var createdEvent = events.First(e => e.Title == "Unlimited Event");
        createdEvent.ParticipantsLimit.Should().BeNull();
    }

    #endregion

    #region GetUniversityEventById Tests

    [Fact]
    public async Task GetUniversityEventById_ShouldReturnEvent()
    {
        // Arrange
        var creatorId = 1L;
        var viewerId = 2L;
        var eventId = await CreateTestEvent(creatorId, "Test Event", "Description", "Location");

        var handler = new GetUniversityEventByIdHandler(
            _repository,
            new TestUserContextService(viewerId));

        var command = new GetUniversityEventByIdCommand(eventId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(eventId);
        result.Title.Should().Be("Test Event");
        result.Description.Should().Be("Description");
        result.Location.Should().Be("Location");
        result.CreatorId.Should().Be(creatorId);
        result.IsCurrentUserRegistered.Should().BeFalse();
    }

    [Fact]
    public async Task GetUniversityEventById_WithInvalidId_ShouldThrowNotFoundException()
    {
        // Arrange
        var handler = new GetUniversityEventByIdHandler(
            _repository,
            new TestUserContextService(1L));

        var command = new GetUniversityEventByIdCommand(999L);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task GetUniversityEventById_WithRegisteredUser_ShouldShowRegistrationStatus()
    {
        // Arrange
        var creatorId = 1L;
        var participantId = 2L;
        var eventId = await CreateTestEvent(creatorId, "Test Event", "Description", "Location");

        var registration = new UniversityEventRegistration(
            eventId,
            participantId,
            DateTimeOffset.UtcNow);
        await _context.UniversityEventRegistrations.AddAsync(registration);
        await _context.SaveChangesAsync();

        var handler = new GetUniversityEventByIdHandler(
            _repository,
            new TestUserContextService(participantId));

        var command = new GetUniversityEventByIdCommand(eventId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsCurrentUserRegistered.Should().BeTrue();
        result.RegisteredParticipantsCount.Should().Be(1);
    }

    #endregion

    #region GetUniversityEvents Tests

    [Fact]
    public async Task GetUniversityEvents_ShouldReturnAllEvents()
    {
        // Arrange
        var creatorId = 1L;
        var viewerId = 2L;
        await CreateTestEvent(creatorId, "Event 1", "Description 1", "Location 1");
        await CreateTestEvent(creatorId, "Event 2", "Description 2", "Location 2");

        var handler = new GetUniversityEventsHandler(
            _repository,
            new TestUserContextService(viewerId));

        var command = new GetUniversityEventsCommand(null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(e => e.Title == "Event 1");
        result.Should().Contain(e => e.Title == "Event 2");
    }

    [Fact]
    public async Task GetUniversityEvents_WithTagFilter_ShouldReturnFilteredEvents()
    {
        // Arrange
        var creatorId = 1L;
        var viewerId = 2L;
        var tagId = Guid.NewGuid();
        var tag = new Tag(tagId, "Technology");
        await _context.Tags.AddAsync(tag);
        await _context.SaveChangesAsync();

        var event1 = await CreateTestEventWithTags(creatorId, "Tech Event", new List<Guid> { tagId });
        await CreateTestEvent(creatorId, "Other Event", "Description", "Location");

        var handler = new GetUniversityEventsHandler(
            _repository,
            new TestUserContextService(viewerId));

        var command = new GetUniversityEventsCommand(new List<Guid> { tagId });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(e => e.Id == event1);
        result.Should().NotContain(e => e.Title == "Other Event");
    }

    [Fact]
    public async Task GetUniversityEvents_WithMultipleTags_ShouldReturnEventsWithAnyTag()
    {
        // Arrange
        var creatorId = 1L;
        var viewerId = 2L;
        var tag1Id = Guid.NewGuid();
        var tag2Id = Guid.NewGuid();
        var tag1 = new Tag(tag1Id, "Technology");
        var tag2 = new Tag(tag2Id, "Education");
        await _context.Tags.AddRangeAsync(tag1, tag2);
        await _context.SaveChangesAsync();

        var event1 = await CreateTestEventWithTags(creatorId, "Tech Event", new List<Guid> { tag1Id });
        var event2 = await CreateTestEventWithTags(creatorId, "Edu Event", new List<Guid> { tag2Id });
        await CreateTestEvent(creatorId, "Other Event", "Description", "Location");

        var handler = new GetUniversityEventsHandler(
            _repository,
            new TestUserContextService(viewerId));

        var command = new GetUniversityEventsCommand(new List<Guid> { tag1Id, tag2Id });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(e => e.Id == event1);
        result.Should().Contain(e => e.Id == event2);
    }

    #endregion

    #region UpdateUniversityEvent Tests

    [Fact]
    public async Task UpdateUniversityEvent_ShouldUpdateEvent()
    {
        // Arrange
        var creatorId = 1L;
        var eventId = await CreateTestEvent(creatorId, "Original Title", "Original Description", "Original Location");

        var newTagId = Guid.NewGuid();
        var updateRequest = new UpdateUniversityEventCommand(
            eventId,
            "Updated Title",
            "Updated Description",
            "Updated Location",
            100,
            DateTimeOffset.UtcNow.AddDays(10),
            DateTimeOffset.UtcNow.AddDays(10).AddHours(3),
            new List<TagDto> { new TagDto(newTagId, "New Tag") });

        var handler = new UpdateUniversityEventHandler(
            _repository,
            new TestReminderScheduler());

        // Act
        await handler.Handle(updateRequest, CancellationToken.None);

        // Assert
        var updatedEvent = await _repository.GetById(eventId);
        updatedEvent.Should().NotBeNull();
        updatedEvent!.Title.Should().Be("Updated Title");
        updatedEvent.Description.Should().Be("Updated Description");
        updatedEvent.Location.Should().Be("Updated Location");
        updatedEvent.ParticipantsLimit.Should().Be(100);
        updatedEvent.Tags.Should().Contain(t => t.Id == newTagId);
    }

    [Fact]
    public async Task UpdateUniversityEvent_WithInvalidId_ShouldThrowNotFoundException()
    {
        // Arrange
        var updateRequest = new UpdateUniversityEventCommand(
            999L,
            "Title",
            "Description",
            "Location",
            null,
            DateTimeOffset.UtcNow.AddDays(1),
            DateTimeOffset.UtcNow.AddDays(1).AddHours(2),
            new List<TagDto>());

        var handler = new UpdateUniversityEventHandler(
            _repository,
            new TestReminderScheduler());

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(updateRequest, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateUniversityEvent_WithExistingTags_ShouldReuseTags()
    {
        // Arrange
        var creatorId = 1L;
        var existingTagId = Guid.NewGuid();
        var existingTag = new Tag(existingTagId, "Existing Tag");
        await _context.Tags.AddAsync(existingTag);
        await _context.SaveChangesAsync();

        var eventId = await CreateTestEvent(creatorId, "Event", "Description", "Location");

        var updateRequest = new UpdateUniversityEventCommand(
            eventId,
            "Event",
            "Description",
            "Location",
            null,
            DateTimeOffset.UtcNow.AddDays(1),
            DateTimeOffset.UtcNow.AddDays(1).AddHours(2),
            new List<TagDto> { new TagDto(existingTagId, "Existing Tag") });

        var handler = new UpdateUniversityEventHandler(
            _repository,
            new TestReminderScheduler());

        // Act
        await handler.Handle(updateRequest, CancellationToken.None);

        // Assert
        var updatedEvent = await _repository.GetById(eventId);
        updatedEvent!.Tags.Should().ContainSingle(t => t.Id == existingTagId);
    }

    #endregion

    #region DeleteUniversityEvent Tests

    [Fact]
    public async Task DeleteUniversityEvent_ShouldDeleteEvent()
    {
        // Arrange
        var creatorId = 1L;
        var eventId = await CreateTestEvent(creatorId, "Event to Delete", "Description", "Location");

        var handler = new DeleteUniversityEventHandler(
            _repository,
            new TestReminderScheduler());

        var command = new DeleteUniversityEventCommand(eventId);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var deletedEvent = await _repository.GetById(eventId);
        deletedEvent.Should().BeNull();
    }

    [Fact]
    public async Task DeleteUniversityEvent_WithInvalidId_ShouldThrowNotFoundException()
    {
        // Arrange
        var handler = new DeleteUniversityEventHandler(
            _repository,
            new TestReminderScheduler());

        var command = new DeleteUniversityEventCommand(999L);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task DeleteUniversityEvent_WithRegistrations_ShouldDeleteRegistrations()
    {
        // Arrange
        var creatorId = 1L;
        var participantId = 2L;
        var eventId = await CreateTestEvent(creatorId, "Event", "Description", "Location");

        var registration = new UniversityEventRegistration(
            eventId,
            participantId,
            DateTimeOffset.UtcNow);
        await _context.UniversityEventRegistrations.AddAsync(registration);
        await _context.SaveChangesAsync();

        var handler = new DeleteUniversityEventHandler(
            _repository,
            new TestReminderScheduler());

        var command = new DeleteUniversityEventCommand(eventId);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var deletedEvent = await _repository.GetById(eventId);
        deletedEvent.Should().BeNull();
        
        var registrations = await _repository.GetRegistrationsForEvent(eventId);
        registrations.Should().BeEmpty();
    }

    #endregion

    #region GetUniversityEventTags Tests

    [Fact]
    public async Task GetUniversityEventTags_ShouldReturnAllTags()
    {
        // Arrange
        var tag1 = new Tag(Guid.NewGuid(), "Technology");
        var tag2 = new Tag(Guid.NewGuid(), "Education");
        await _context.Tags.AddRangeAsync(tag1, tag2);
        await _context.SaveChangesAsync();

        var handler = new GetUniversityEventTagsHandler(_repository);
        var command = new GetUniversityEventTagsCommand();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(t => t.Name == "Technology");
        result.Should().Contain(t => t.Name == "Education");
    }

    [Fact]
    public async Task GetUniversityEventTags_WithNoTags_ShouldReturnEmptyList()
    {
        // Arrange
        var handler = new GetUniversityEventTagsHandler(_repository);
        var command = new GetUniversityEventTagsCommand();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region SearchUniversityEvents Tests

    [Fact]
    public async Task SearchUniversityEvents_ShouldReturnMatchingEvents()
    {
        // Arrange
        var creatorId = 1L;
        var viewerId = 2L;
        await CreateTestEvent(creatorId, "Technology Conference", "Tech event description", "Location");
        await CreateTestEvent(creatorId, "Music Festival", "Music event description", "Location");

        var handler = new SearchUniversityEventsHandler(
            _repository,
            new TestUserContextService(viewerId));

        var command = new SearchUniversityEventsCommand("Technology");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().ContainSingle(e => e.Title == "Technology Conference");
        result.Should().NotContain(e => e.Title == "Music Festival");
    }

    [Fact]
    public async Task SearchUniversityEvents_ShouldSearchInDescription()
    {
        // Arrange
        var creatorId = 1L;
        var viewerId = 2L;
        await CreateTestEvent(creatorId, "Event 1", "This is about programming", "Location");
        await CreateTestEvent(creatorId, "Event 2", "This is about music", "Location");

        var handler = new SearchUniversityEventsHandler(
            _repository,
            new TestUserContextService(viewerId));

        var command = new SearchUniversityEventsCommand("programming");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().ContainSingle(e => e.Title == "Event 1");
        result.Should().NotContain(e => e.Title == "Event 2");
    }

    [Fact]
    public async Task SearchUniversityEvents_WithEmptyQuery_ShouldThrowBadRequestException()
    {
        // Arrange
        var handler = new SearchUniversityEventsHandler(
            _repository,
            new TestUserContextService(1L));

        var command = new SearchUniversityEventsCommand("   ");

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task SearchUniversityEvents_WithNullQuery_ShouldThrowBadRequestException()
    {
        // Arrange
        var handler = new SearchUniversityEventsHandler(
            _repository,
            new TestUserContextService(1L));

        var command = new SearchUniversityEventsCommand(string.Empty);

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task SearchUniversityEvents_ShouldBeCaseInsensitive()
    {
        // Arrange
        var creatorId = 1L;
        var viewerId = 2L;
        await CreateTestEvent(creatorId, "Technology Event", "Description", "Location");

        var handler = new SearchUniversityEventsHandler(
            _repository,
            new TestUserContextService(viewerId));

        var command = new SearchUniversityEventsCommand("TECHNOLOGY");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().ContainSingle(e => e.Title == "Technology Event");
    }

    #endregion

    #region RegisterForUniversityEvent Tests

    [Fact]
    public async Task RegisterForUniversityEvent_ShouldRegisterUser()
    {
        // Arrange
        var creatorId = 1L;
        var participantId = 2L;
        var eventId = await CreateTestEvent(creatorId, "Event", "Description", "Location", 50);

        var handler = new RegisterForUniversityEventHandler(
            _repository,
            new TestUserContextService(participantId),
            new TestReminderScheduler());

        var command = new RegisterForUniversityEventCommand(eventId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsCurrentUserRegistered.Should().BeTrue();
        result.RegisteredParticipantsCount.Should().Be(1);

        var hasRegistration = await _repository.HasUserRegistration(eventId, participantId);
        hasRegistration.Should().BeTrue();
    }

    [Fact]
    public async Task RegisterForUniversityEvent_WithInvalidId_ShouldThrowNotFoundException()
    {
        // Arrange
        var handler = new RegisterForUniversityEventHandler(
            _repository,
            new TestUserContextService(1L),
            new TestReminderScheduler());

        var command = new RegisterForUniversityEventCommand(999L);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task RegisterForUniversityEvent_WhenAlreadyRegistered_ShouldThrowBadRequestException()
    {
        // Arrange
        var creatorId = 1L;
        var participantId = 2L;
        var eventId = await CreateTestEvent(creatorId, "Event", "Description", "Location");

        var registration = new UniversityEventRegistration(
            eventId,
            participantId,
            DateTimeOffset.UtcNow);
        await _context.UniversityEventRegistrations.AddAsync(registration);
        await _context.SaveChangesAsync();

        var handler = new RegisterForUniversityEventHandler(
            _repository,
            new TestUserContextService(participantId),
            new TestReminderScheduler());

        var command = new RegisterForUniversityEventCommand(eventId);

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task RegisterForUniversityEvent_WhenLimitReached_ShouldThrowBadRequestException()
    {
        // Arrange
        var creatorId = 1L;
        var participantId1 = 2L;
        var participantId2 = 3L;
        var participantId3 = 4L;
        var eventId = await CreateTestEvent(creatorId, "Event", "Description", "Location", 2);

        // Register two participants to reach limit
        var registration1 = new UniversityEventRegistration(
            eventId,
            participantId1,
            DateTimeOffset.UtcNow);
        var registration2 = new UniversityEventRegistration(
            eventId,
            participantId2,
            DateTimeOffset.UtcNow);
        await _context.UniversityEventRegistrations.AddRangeAsync(registration1, registration2);
        await _context.SaveChangesAsync();

        var handler = new RegisterForUniversityEventHandler(
            _repository,
            new TestUserContextService(participantId3),
            new TestReminderScheduler());

        var command = new RegisterForUniversityEventCommand(eventId);

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task RegisterForUniversityEvent_WithoutLimit_ShouldAllowRegistration()
    {
        // Arrange
        var creatorId = 1L;
        var participantId = 2L;
        var eventId = await CreateTestEvent(creatorId, "Event", "Description", "Location", null);

        var handler = new RegisterForUniversityEventHandler(
            _repository,
            new TestUserContextService(participantId),
            new TestReminderScheduler());

        var command = new RegisterForUniversityEventCommand(eventId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsCurrentUserRegistered.Should().BeTrue();
    }

    #endregion

    #region UnregisterFromUniversityEvent Tests

    [Fact]
    public async Task UnregisterFromUniversityEvent_ShouldUnregisterUser()
    {
        // Arrange
        var creatorId = 1L;
        var participantId = 2L;
        var eventId = await CreateTestEvent(creatorId, "Event", "Description", "Location");

        var registration = new UniversityEventRegistration(
            eventId,
            participantId,
            DateTimeOffset.UtcNow);
        await _context.UniversityEventRegistrations.AddAsync(registration);
        await _context.SaveChangesAsync();

        var handler = new UnregisterFromUniversityEventHandler(
            _repository,
            new TestUserContextService(participantId),
            new TestReminderScheduler());

        var command = new UnregisterFromUniversityEventCommand(eventId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsCurrentUserRegistered.Should().BeFalse();
        result.RegisteredParticipantsCount.Should().Be(0);

        var hasRegistration = await _repository.HasUserRegistration(eventId, participantId);
        hasRegistration.Should().BeFalse();
    }

    [Fact]
    public async Task UnregisterFromUniversityEvent_WithInvalidId_ShouldThrowNotFoundException()
    {
        // Arrange
        var handler = new UnregisterFromUniversityEventHandler(
            _repository,
            new TestUserContextService(1L),
            new TestReminderScheduler());

        var command = new UnregisterFromUniversityEventCommand(999L);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task UnregisterFromUniversityEvent_WhenNotRegistered_ShouldThrowBadRequestException()
    {
        // Arrange
        var creatorId = 1L;
        var participantId = 2L;
        var eventId = await CreateTestEvent(creatorId, "Event", "Description", "Location");

        var handler = new UnregisterFromUniversityEventHandler(
            _repository,
            new TestUserContextService(participantId),
            new TestReminderScheduler());

        var command = new UnregisterFromUniversityEventCommand(eventId);

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task UnregisterFromUniversityEvent_WithMultipleRegistrations_ShouldOnlyUnregisterCurrentUser()
    {
        // Arrange
        var creatorId = 1L;
        var participantId1 = 2L;
        var participantId2 = 3L;
        var eventId = await CreateTestEvent(creatorId, "Event", "Description", "Location");

        var registration1 = new UniversityEventRegistration(
            eventId,
            participantId1,
            DateTimeOffset.UtcNow);
        var registration2 = new UniversityEventRegistration(
            eventId,
            participantId2,
            DateTimeOffset.UtcNow);
        await _context.UniversityEventRegistrations.AddRangeAsync(registration1, registration2);
        await _context.SaveChangesAsync();

        var handler = new UnregisterFromUniversityEventHandler(
            _repository,
            new TestUserContextService(participantId1),
            new TestReminderScheduler());

        var command = new UnregisterFromUniversityEventCommand(eventId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsCurrentUserRegistered.Should().BeFalse();
        result.RegisteredParticipantsCount.Should().Be(1);

        var hasRegistration1 = await _repository.HasUserRegistration(eventId, participantId1);
        hasRegistration1.Should().BeFalse();

        var hasRegistration2 = await _repository.HasUserRegistration(eventId, participantId2);
        hasRegistration2.Should().BeTrue();
    }

    #endregion

    #region Helper Methods

    private async Task<long> CreateTestEvent(
        long creatorId,
        string title,
        string description,
        string location,
        long? participantsLimit = null)
    {
        var startDateTime = DateTimeOffset.UtcNow.AddDays(7);
        var endDateTime = startDateTime.AddHours(2);

        var universityEvent = new UniversityEvent(
            title,
            description,
            location,
            creatorId,
            startDateTime,
            endDateTime,
            participantsLimit,
            new List<Tag>());

        await _repository.Save(universityEvent);
        return universityEvent.Id;
    }

    private async Task<long> CreateTestEventWithTags(
        long creatorId,
        string title,
        List<Guid> tagIds)
    {
        var tags = new List<Tag>();
        foreach (var tagId in tagIds)
        {
            var existingTag = await _context.Tags.FirstOrDefaultAsync(t => t.Id == tagId);
            if (existingTag == null)
            {
                existingTag = new Tag(tagId, $"Tag {tagId}");
                await _context.Tags.AddAsync(existingTag);
                await _context.SaveChangesAsync();
            }
            tags.Add(existingTag);
        }

        var startDateTime = DateTimeOffset.UtcNow.AddDays(7);
        var endDateTime = startDateTime.AddHours(2);

        var universityEvent = new UniversityEvent(
            title,
            "Description",
            "Location",
            creatorId,
            startDateTime,
            endDateTime,
            null,
            tags);

        await _repository.Save(universityEvent);
        return universityEvent.Id;
    }

    #endregion

    public void Dispose()
    {
        _context?.Dispose();
    }
}

// Test helpers
internal class TestUserContextService : IUserContextService
{
    private readonly long? _userId;

    public TestUserContextService(long? userId = null)
    {
        _userId = userId;
    }

    public User GetCurrentUser()
    {
        var user = GetCurrentUserOrDefault();
        if (user == null)
        {
            throw new ForbiddenException("User is not authenticated in test context.");
        }

        return user;
    }

    public User? GetCurrentUserOrDefault()
    {
        return _userId.HasValue
            ? new User(_userId.Value, "Test", "User", "testuser")
            : null;
    }
}

internal class TestReminderScheduler : IUniversityEventReminderScheduler
{
    public Task ScheduleForRegistration(
        UniversityEvent universityEvent,
        long userId,
        CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    public Task RescheduleForEvent(
        UniversityEvent universityEvent,
        IReadOnlyCollection<UniversityEventRegistration> registrations,
        CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    public Task DeleteForEvent(
        long eventId,
        IReadOnlyCollection<UniversityEventRegistration> registrations)
    {
        return Task.CompletedTask;
    }

    public Task DeleteForRegistration(long eventId, long userId)
    {
        return Task.CompletedTask;
    }
}

internal class TestUniversityEventsRepository : IUniversityEventsRepository
{
    private readonly UniversityEventsDbContext _context;

    public TestUniversityEventsRepository(UniversityEventsDbContext context)
    {
        _context = context;
    }

    public async Task Save(UniversityEvent universityEvent)
    {
        await _context.AddAsync(universityEvent);
        await _context.SaveChangesAsync();
    }

    public async Task<List<UniversityEvent>> Get(List<Guid>? tags)
    {
        IQueryable<UniversityEvent> query = _context.UniversityEvents
            .Include(x => x.Tags)
            .Include(x => x.Registrations)
            .AsSplitQuery();

        if (tags != null)
        {
            query = query.Where(x => x.Tags.Any(t => tags.Contains(t.Id)));
        }

        return await query.ToListAsync();
    }

    public Task<List<Tag>> GetTags()
    {
        return _context.Tags.ToListAsync();
    }

    public async Task<List<Tag>> GetExistsTags(List<Guid> tagIds)
    {
        return await _context.Tags
            .Where(x => tagIds.Contains(x.Id))
            .ToListAsync();
    }

    public Task<List<UniversityEvent>> Search(string query)
    {
        var pattern = $"%{query}%";

        return _context.UniversityEvents
            .Where(x => Microsoft.EntityFrameworkCore.EF.Functions.ILike(x.Title, pattern) || Microsoft.EntityFrameworkCore.EF.Functions.ILike(x.Description, pattern))
            .Include(x => x.Tags)
            .Include(x => x.Registrations)
            .AsSplitQuery()
            .ToListAsync();
    }

    public async Task SaveTags(List<Tag> tags)
    {
        await _context.Tags.AddRangeAsync(tags);
        await _context.SaveChangesAsync();
    }

    public Task<UniversityEvent?> GetById(long eventId)
    {
        return _context.UniversityEvents
            .Include(x => x.Tags)
            .Include(x => x.Registrations)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.Id == eventId);
    }

    public async Task<List<UniversityEvent>> GetByIds(List<long> eventIds)
    {
        if (eventIds.Count == 0)
        {
            return new List<UniversityEvent>();
        }

        return await _context.UniversityEvents
            .Where(x => eventIds.Contains(x.Id))
            .Include(x => x.Tags)
            .Include(x => x.Registrations)
            .AsSplitQuery()
            .ToListAsync();
    }

    public async Task Delete(UniversityEvent universityEvent)
    {
        _context.UniversityEvents.Remove(universityEvent);
        await _context.SaveChangesAsync();
    }

    public Task SaveChanges()
    {
        return _context.SaveChangesAsync();
    }

    public Task<int> GetRegistrationsCount(long eventId)
    {
        return _context.UniversityEventRegistrations
            .Where(registration => registration.UniversityEventId == eventId)
            .CountAsync();
    }

    public Task<bool> HasUserRegistration(long eventId, long userId)
    {
        return _context.UniversityEventRegistrations
            .AnyAsync(registration => registration.UniversityEventId == eventId && registration.UserId == userId);
    }

    public async Task AddRegistration(UniversityEventRegistration registration)
    {
        await _context.UniversityEventRegistrations.AddAsync(registration);
        await _context.SaveChangesAsync();
    }

    public Task<List<UniversityEventRegistration>> GetRegistrationsForEvent(long eventId)
    {
        return _context.UniversityEventRegistrations
            .Where(registration => registration.UniversityEventId == eventId)
            .ToListAsync();
    }

    public Task<UniversityEventRegistration?> GetUserRegistration(long eventId, long userId)
    {
        return _context.UniversityEventRegistrations
            .FirstOrDefaultAsync(registration => registration.UniversityEventId == eventId && registration.UserId == userId);
    }

    public async Task RemoveRegistration(UniversityEventRegistration registration)
    {
        _context.UniversityEventRegistrations.Remove(registration);
        await _context.SaveChangesAsync();
    }
}

