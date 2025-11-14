using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using HacatonMax.University.StudentsProject.Application.Commands.RequestStudentProjectParticipation;
using HacatonMax.University.StudentsProject.Domain;
using HacatonMax.University.StudentsProject.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HacatonMax.University.StudentsProject.Tests;

public class StudentProjectsControllerTests : IDisposable
{
    private readonly StudentProjectsDbContext _context;
    private readonly IStudentProjectsRepository _repository;

    public StudentProjectsControllerTests()
    {
        var options = new DbContextOptionsBuilder<StudentProjectsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new StudentProjectsDbContext(options);
        _repository = new StudentProjectRepository(_context);
    }

    [Fact]
    public async Task RequestParticipation_ShouldAddParticipant()
    {
        // Arrange
        var projectId = Guid.NewGuid();
        var creatorId = 1L;
        var participantUserId = 2L;

        var project = new StudentProject(
            projectId,
            "Test Project",
            "Test Description",
            creatorId,
            new List<Skill>());

        // Add creator as participant
        var creatorParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            creatorId,
            StudentProjectParticipantStatus.Approved,
            true,
            DateTimeOffset.UtcNow);

        project.AddParticipant(creatorParticipant);
        await _context.StudentProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        var handler = new RequestStudentProjectParticipationHandler(
            _repository,
            new TestUserContextService(participantUserId));

        var command = new RequestStudentProjectParticipationCommand(
            projectId,
            null,
            null);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var updatedProject = await _repository.GetById(projectId);
        updatedProject.Should().NotBeNull();
        updatedProject!.Participants.Should().Contain(p => p.UserId == participantUserId && p.Status == StudentProjectParticipantStatus.Applied);
    }

    [Fact]
    public async Task RequestParticipation_AsCreator_ShouldThrowException()
    {
        // Arrange
        var projectId = Guid.NewGuid();
        var creatorId = 1L;

        var project = new StudentProject(
            projectId,
            "Test Project",
            "Test Description",
            creatorId,
            new List<Skill>());

        var creatorParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            creatorId,
            StudentProjectParticipantStatus.Approved,
            true,
            DateTimeOffset.UtcNow);

        project.AddParticipant(creatorParticipant);
        await _context.StudentProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        var handler = new RequestStudentProjectParticipationHandler(
            _repository,
            new TestUserContextService(creatorId));

        var command = new RequestStudentProjectParticipationCommand(
            projectId,
            null,
            null);

        // Act & Assert
        await Assert.ThrowsAsync<HacatonMax.Common.Exceptions.BadRequestException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task ApproveParticipant_ShouldUpdateStatus()
    {
        // Arrange
        var projectId = Guid.NewGuid();
        var creatorId = 1L;
        var participantUserId = 2L;

        var project = new StudentProject(
            projectId,
            "Test Project",
            "Test Description",
            creatorId,
            new List<Skill>());

        var creatorParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            creatorId,
            StudentProjectParticipantStatus.Approved,
            true,
            DateTimeOffset.UtcNow);

        var appliedParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            participantUserId,
            StudentProjectParticipantStatus.Applied,
            false,
            DateTimeOffset.UtcNow);

        project.AddParticipant(creatorParticipant);
        project.AddParticipant(appliedParticipant);
        await _context.StudentProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        var handler = new HacatonMax.University.StudentsProject.Application.Commands.ApproveStudentProjectParticipant.ApproveStudentProjectParticipantHandler(
            _repository,
            new TestUserContextService(creatorId));

        var command = new HacatonMax.University.StudentsProject.Application.Commands.ApproveStudentProjectParticipant.ApproveStudentProjectParticipantCommand(
            projectId,
            appliedParticipant.Id,
            null,
            null);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var updatedProject = await _repository.GetById(projectId);
        updatedProject.Should().NotBeNull();
        var approvedParticipant = updatedProject!.Participants.FirstOrDefault(p => p.Id == appliedParticipant.Id);
        approvedParticipant.Should().NotBeNull();
        approvedParticipant!.Status.Should().Be(StudentProjectParticipantStatus.Approved);
    }

    [Fact]
    public async Task RejectParticipant_ShouldUpdateStatus()
    {
        // Arrange
        var projectId = Guid.NewGuid();
        var creatorId = 1L;
        var participantUserId = 2L;

        var project = new StudentProject(
            projectId,
            "Test Project",
            "Test Description",
            creatorId,
            new List<Skill>());

        var creatorParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            creatorId,
            StudentProjectParticipantStatus.Approved,
            true,
            DateTimeOffset.UtcNow);

        var appliedParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            participantUserId,
            StudentProjectParticipantStatus.Applied,
            false,
            DateTimeOffset.UtcNow);

        project.AddParticipant(creatorParticipant);
        project.AddParticipant(appliedParticipant);
        await _context.StudentProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        var handler = new HacatonMax.University.StudentsProject.Application.Commands.RejectStudentProjectParticipant.RejectStudentProjectParticipantHandler(
            _repository,
            new TestUserContextService(creatorId));

        var command = new HacatonMax.University.StudentsProject.Application.Commands.RejectStudentProjectParticipant.RejectStudentProjectParticipantCommand(
            projectId,
            appliedParticipant.Id);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var updatedProject = await _repository.GetById(projectId);
        updatedProject.Should().NotBeNull();
        var rejectedParticipant = updatedProject!.Participants.FirstOrDefault(p => p.Id == appliedParticipant.Id);
        rejectedParticipant.Should().NotBeNull();
        rejectedParticipant!.Status.Should().Be(StudentProjectParticipantStatus.Rejected);
    }

    [Fact]
    public async Task RemoveParticipant_ShouldDeleteParticipant()
    {
        // Arrange
        var projectId = Guid.NewGuid();
        var creatorId = 1L;
        var participantUserId = 2L;

        var project = new StudentProject(
            projectId,
            "Test Project",
            "Test Description",
            creatorId,
            new List<Skill>());

        var creatorParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            creatorId,
            StudentProjectParticipantStatus.Approved,
            true,
            DateTimeOffset.UtcNow);

        var approvedParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            participantUserId,
            StudentProjectParticipantStatus.Approved,
            false,
            DateTimeOffset.UtcNow);

        project.AddParticipant(creatorParticipant);
        project.AddParticipant(approvedParticipant);
        await _context.StudentProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        var handler = new HacatonMax.University.StudentsProject.Application.Commands.RemoveStudentProjectParticipant.RemoveStudentProjectParticipantHandler(
            _repository,
            new TestUserContextService(creatorId));

        var command = new HacatonMax.University.StudentsProject.Application.Commands.RemoveStudentProjectParticipant.RemoveStudentProjectParticipantCommand(
            projectId,
            approvedParticipant.Id);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var updatedProject = await _repository.GetById(projectId);
        updatedProject.Should().NotBeNull();
        updatedProject!.Participants.Should().NotContain(p => p.Id == approvedParticipant.Id);
        updatedProject.Participants.Should().Contain(p => p.Id == creatorParticipant.Id); // Creator should remain
    }

    [Fact]
    public async Task CreateTeamRole_ShouldCreateRole()
    {
        // Arrange
        var handler = new HacatonMax.University.StudentsProject.Application.Commands.CreateTeamRole.CreateTeamRoleHandler(_repository);
        var command = new HacatonMax.University.StudentsProject.Application.Commands.CreateTeamRole.CreateTeamRoleCommand("Test Role", "Test Description");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Test Role");
        result.Description.Should().Be("Test Description");

        var allRoles = await _repository.GetAllTeamRoles();
        allRoles.Should().Contain(r => r.Name == "Test Role");
    }

    [Fact]
    public async Task GetStudentProjectById_ShouldReturnProject()
    {
        // Arrange
        var projectId = Guid.NewGuid();
        var creatorId = 1L;

        var project = new StudentProject(
            projectId,
            "Test Project",
            "Test Description",
            creatorId,
            new List<Skill>());

        var creatorParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            creatorId,
            StudentProjectParticipantStatus.Approved,
            true,
            DateTimeOffset.UtcNow);

        project.AddParticipant(creatorParticipant);
        await _context.StudentProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        var handler = new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjectById.GetStudentProjectByIdHandler(
            _repository,
            new TestUniversityEventsRepository());

        var command = new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjectById.GetStudentProjectByIdCommand(projectId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(projectId);
        result.Title.Should().Be("Test Project");
        result.Description.Should().Be("Test Description");
    }

    [Fact]
    public async Task GetStudentProjectById_WithInvalidId_ShouldThrowNotFoundException()
    {
        // Arrange
        var handler = new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjectById.GetStudentProjectByIdHandler(
            _repository,
            new TestUniversityEventsRepository());

        var command = new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjectById.GetStudentProjectByIdCommand(Guid.NewGuid());

        // Act & Assert
        await Assert.ThrowsAsync<HacatonMax.Common.Exceptions.NotFoundException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task GetStudentProjects_ShouldReturnProjects()
    {
        // Arrange
        var projectId1 = Guid.NewGuid();
        var projectId2 = Guid.NewGuid();
        var creatorId = 1L;

        var project1 = new StudentProject(projectId1, "Project 1", "Description 1", creatorId, new List<Skill>());
        var project2 = new StudentProject(projectId2, "Project 2", "Description 2", creatorId, new List<Skill>());

        await _context.StudentProjects.AddRangeAsync(project1, project2);
        await _context.SaveChangesAsync();

        var handler = new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjects.GetStudentProjectsHandler(
            _repository,
            new TestUniversityEventsRepository());

        var command = new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjects.GetStudentProjectsCommand();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Count.Should().BeGreaterThanOrEqualTo(2);
        result.Should().Contain(p => p.Id == projectId1);
        result.Should().Contain(p => p.Id == projectId2);
    }

    [Fact]
    public async Task UpdateParticipantRoles_ShouldUpdateRoles()
    {
        // Arrange
        var projectId = Guid.NewGuid();
        var creatorId = 1L;
        var participantUserId = 2L;

        // Create team roles first
        var teamRole = new TeamRole(Guid.NewGuid(), "Developer", "Develops code");
        var newTeamRole = new TeamRole(Guid.NewGuid(), "Designer", "Designs UI");
        await _repository.AddTeamRoles(new[] { teamRole, newTeamRole });
        await _repository.SaveChanges();

        var project = new StudentProject(
            projectId,
            "Test Project",
            "Test Description",
            creatorId,
            new List<Skill>());

        var creatorParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            creatorId,
            StudentProjectParticipantStatus.Approved,
            true,
            DateTimeOffset.UtcNow);

        var approvedParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            participantUserId,
            StudentProjectParticipantStatus.Approved,
            false,
            DateTimeOffset.UtcNow);

        project.AddParticipant(creatorParticipant);
        project.AddParticipant(approvedParticipant);
        await _context.StudentProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        // Add an existing role to participant after saving to test role replacement
        var existingRole = new StudentProjectParticipantRole(Guid.NewGuid(), approvedParticipant.Id, teamRole.Id);
        await _context.StudentProjectParticipantRoles.AddAsync(existingRole);
        await _context.SaveChangesAsync();

        // Detach all entities to simulate fresh load
        _context.ChangeTracker.Clear();

        var handler = new HacatonMax.University.StudentsProject.Application.Commands.UpdateStudentProjectParticipantRoles.UpdateStudentProjectParticipantRolesHandler(
            _repository,
            new TestUserContextService(creatorId));

        // Reload project to get fresh participant with tracked roles
        var reloadedProject = await _repository.GetById(projectId);
        reloadedProject.Should().NotBeNull();
        var reloadedParticipant = reloadedProject!.Participants.FirstOrDefault(p => p.Id == approvedParticipant.Id);
        reloadedParticipant.Should().NotBeNull();
        reloadedParticipant!.ParticipantRoles.Count.Should().Be(1); // Should have the existing role

        var command = new HacatonMax.University.StudentsProject.Application.Commands.UpdateStudentProjectParticipantRoles.UpdateStudentProjectParticipantRolesCommand(
            projectId,
            reloadedParticipant.Id,
            new List<Guid> { newTeamRole.Id },
            null);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var updatedProject = await _repository.GetById(projectId);
        updatedProject.Should().NotBeNull();
        var updatedParticipant = updatedProject!.Participants.FirstOrDefault(p => p.Id == reloadedParticipant.Id);
        updatedParticipant.Should().NotBeNull();
        updatedParticipant!.ParticipantRoles.Should().Contain(r => r.TeamRoleId == newTeamRole.Id);
        updatedParticipant.ParticipantRoles.Should().NotContain(r => r.TeamRoleId == teamRole.Id);
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}

// Test helper для IUniversityEventsRepository
internal class TestUniversityEventsRepository : HacatonMax.University.Events.Domain.IUniversityEventsRepository
{
    public Task<HacatonMax.University.Events.Domain.UniversityEvent?> GetById(long id)
    {
        return Task.FromResult<HacatonMax.University.Events.Domain.UniversityEvent?>(null);
    }

    public Task<List<HacatonMax.University.Events.Domain.UniversityEvent>> GetByIds(List<long> ids)
    {
        return Task.FromResult(new List<HacatonMax.University.Events.Domain.UniversityEvent>());
    }

    public Task Save(HacatonMax.University.Events.Domain.UniversityEvent universityEvent) => Task.CompletedTask;
    public Task<List<HacatonMax.University.Events.Domain.UniversityEvent>> Get(List<Guid>? tags) => Task.FromResult(new List<HacatonMax.University.Events.Domain.UniversityEvent>());
    public Task<List<HacatonMax.University.Events.Domain.UniversityEvent>> Search(string query) => Task.FromResult(new List<HacatonMax.University.Events.Domain.UniversityEvent>());
    public Task<List<HacatonMax.University.Events.Domain.Tag>> GetTags() => Task.FromResult(new List<HacatonMax.University.Events.Domain.Tag>());
    public Task<List<HacatonMax.University.Events.Domain.Tag>> GetExistsTags(List<Guid> tagIds) => Task.FromResult(new List<HacatonMax.University.Events.Domain.Tag>());
    public Task SaveTags(List<HacatonMax.University.Events.Domain.Tag> tags) => Task.CompletedTask;
    public Task Delete(HacatonMax.University.Events.Domain.UniversityEvent universityEvent) => Task.CompletedTask;
    public Task SaveChanges() => Task.CompletedTask;
    public Task<int> GetRegistrationsCount(long eventId) => Task.FromResult(0);
    public Task<bool> HasUserRegistration(long eventId, long userId) => Task.FromResult(false);
    public Task AddRegistration(HacatonMax.University.Events.Domain.UniversityEventRegistration registration) => Task.CompletedTask;
    public Task<List<HacatonMax.University.Events.Domain.UniversityEventRegistration>> GetRegistrationsForEvent(long eventId) => Task.FromResult(new List<HacatonMax.University.Events.Domain.UniversityEventRegistration>());
    public Task<HacatonMax.University.Events.Domain.UniversityEventRegistration?> GetUserRegistration(long eventId, long userId) => Task.FromResult<HacatonMax.University.Events.Domain.UniversityEventRegistration?>(null);
    public Task RemoveRegistration(HacatonMax.University.Events.Domain.UniversityEventRegistration registration) => Task.CompletedTask;
}

// Test helper для UserContextService
internal class TestUserContextService : HacatonMax.University.Auth.Domain.IUserContextService
{
    private readonly long _userId;

    public TestUserContextService(long userId)
    {
        _userId = userId;
    }

    public HacatonMax.University.Auth.Domain.User GetCurrentUser()
    {
        return new HacatonMax.University.Auth.Domain.User(_userId, "Test", "User", "testuser");
    }
}
