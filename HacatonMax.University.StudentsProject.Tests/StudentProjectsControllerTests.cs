using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using HacatonMax.Bot.Domain;
using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.StudentsProject.Application.Commands.ApproveStudentProjectParticipant;
using HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjectById;
using HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjects;
using HacatonMax.University.StudentsProject.Application.Commands.RemoveStudentProjectParticipant;
using HacatonMax.University.StudentsProject.Application.Commands.RejectStudentProjectParticipant;
using HacatonMax.University.StudentsProject.Application.Commands.RequestStudentProjectParticipation;
using HacatonMax.University.StudentsProject.Application.Commands.UpdateStudentProject;
using HacatonMax.University.StudentsProject.Application.Commands.UpdateStudentProjectParticipantRoles;
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

        var botProvider = new TestBotProvider();

        var handler = new RequestStudentProjectParticipationHandler(
            _repository,
            new TestUserContextService(participantUserId),
            botProvider);

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

        botProvider.SentMessages.Should().ContainSingle(message =>
            message.UserId == creatorId &&
            message.Text.Contains(project.Title, StringComparison.Ordinal));
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

        var botProvider = new TestBotProvider();

        var handler = new RequestStudentProjectParticipationHandler(
            _repository,
            new TestUserContextService(creatorId),
            botProvider);

        var command = new RequestStudentProjectParticipationCommand(
            projectId,
            null,
            null);

        // Act & Assert
        await Assert.ThrowsAsync<HacatonMax.Common.Exceptions.BadRequestException>(
            () => handler.Handle(command, CancellationToken.None));

        botProvider.SentMessages.Should().BeEmpty();
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
    public async Task ApproveParticipant_AsNonCreator_ShouldThrowForbidden()
    {
        var projectId = Guid.NewGuid();
        var creatorId = 1L;
        var outsiderId = 99L;
        var applicantId = 2L;

        var project = new StudentProject(
            projectId,
            "Approval Restricted Project",
            "Description",
            creatorId,
            new List<Skill>());

        var creatorParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            creatorId,
            StudentProjectParticipantStatus.Approved,
            true,
            DateTimeOffset.UtcNow);

        var applicantParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            applicantId,
            StudentProjectParticipantStatus.Applied,
            false,
            DateTimeOffset.UtcNow);

        project.AddParticipant(creatorParticipant);
        project.AddParticipant(applicantParticipant);
        await _context.StudentProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        var handler = new ApproveStudentProjectParticipantHandler(
            _repository,
            new TestUserContextService(outsiderId));

        var command = new ApproveStudentProjectParticipantCommand(
            projectId,
            applicantParticipant.Id,
            null,
            null);

        await Assert.ThrowsAsync<ForbiddenException>(
            () => handler.Handle(command, CancellationToken.None));
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
    public async Task RejectParticipant_AsNonCreator_ShouldThrowForbidden()
    {
        var projectId = Guid.NewGuid();
        var creatorId = 1L;
        var outsiderId = 42L;
        var applicantUserId = 2L;

        var project = new StudentProject(
            projectId,
            "Reject Restricted Project",
            "Description",
            creatorId,
            new List<Skill>());

        var creatorParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            creatorId,
            StudentProjectParticipantStatus.Approved,
            true,
            DateTimeOffset.UtcNow);

        var applicantParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            applicantUserId,
            StudentProjectParticipantStatus.Applied,
            false,
            DateTimeOffset.UtcNow);

        project.AddParticipant(creatorParticipant);
        project.AddParticipant(applicantParticipant);
        await _context.StudentProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        var handler = new RejectStudentProjectParticipantHandler(
            _repository,
            new TestUserContextService(outsiderId));

        var command = new RejectStudentProjectParticipantCommand(projectId, applicantParticipant.Id);

        await Assert.ThrowsAsync<ForbiddenException>(
            () => handler.Handle(command, CancellationToken.None));
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
    public async Task RemoveParticipant_AsNonOwner_ShouldThrowForbidden()
    {
        var projectId = Guid.NewGuid();
        var creatorId = 1L;
        var participantUserId = 2L;

        var project = new StudentProject(
            projectId,
            "Protected Project",
            "Description",
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
            new TestUserContextService(participantUserId));

        var command = new HacatonMax.University.StudentsProject.Application.Commands.RemoveStudentProjectParticipant.RemoveStudentProjectParticipantCommand(
            projectId,
            approvedParticipant.Id);

        await Assert.ThrowsAsync<ForbiddenException>(
            () => handler.Handle(command, CancellationToken.None));

        var updatedProject = await _repository.GetById(projectId);
        updatedProject.Should().NotBeNull();
        updatedProject!.Participants.Should().Contain(p => p.Id == approvedParticipant.Id);
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
            new TestUniversityEventsRepository(),
            new TestUserContextService(creatorId));

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
    public async Task GetStudentProjectById_AsNonOwner_ShouldHidePendingParticipants()
    {
        var projectId = Guid.NewGuid();
        var creatorId = 1L;
        var approvedUserId = 2L;
        var pendingUserId = 3L;
        var outsiderUserId = 99L;

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
            approvedUserId,
            StudentProjectParticipantStatus.Approved,
            false,
            DateTimeOffset.UtcNow);

        var pendingParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            pendingUserId,
            StudentProjectParticipantStatus.Applied,
            false,
            DateTimeOffset.UtcNow);

        project.AddParticipant(creatorParticipant);
        project.AddParticipant(approvedParticipant);
        project.AddParticipant(pendingParticipant);
        await _context.StudentProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        var handler = new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjectById.GetStudentProjectByIdHandler(
            _repository,
            new TestUniversityEventsRepository(),
            new TestUserContextService(outsiderUserId));

        var result = await handler.Handle(
            new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjectById.GetStudentProjectByIdCommand(projectId),
            CancellationToken.None);

        result.Participants.Should().OnlyContain(participant => participant.Status == StudentProjectParticipantStatus.Approved);
        result.Participants.Should().NotContain(participant => participant.UserId == pendingUserId);
    }

    [Fact]
    public async Task GetStudentProjectById_AsPendingApplicant_ShouldContainOwnEntryOnly()
    {
        var projectId = Guid.NewGuid();
        var creatorId = 1L;
        var pendingUserId = 2L;
        var anotherPendingUserId = 3L;

        var project = new StudentProject(
            projectId,
            "Pending Visibility Project",
            "Description",
            creatorId,
            new List<Skill>());

        var creatorParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            creatorId,
            StudentProjectParticipantStatus.Approved,
            true,
            DateTimeOffset.UtcNow);

        var pendingParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            pendingUserId,
            StudentProjectParticipantStatus.Applied,
            false,
            DateTimeOffset.UtcNow);

        var anotherPendingParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            anotherPendingUserId,
            StudentProjectParticipantStatus.Applied,
            false,
            DateTimeOffset.UtcNow);

        project.AddParticipant(creatorParticipant);
        project.AddParticipant(pendingParticipant);
        project.AddParticipant(anotherPendingParticipant);
        await _context.StudentProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        var handler = new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjectById.GetStudentProjectByIdHandler(
            _repository,
            new TestUniversityEventsRepository(),
            new TestUserContextService(pendingUserId));

        var result = await handler.Handle(
            new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjectById.GetStudentProjectByIdCommand(projectId),
            CancellationToken.None);

        result.Participants.Should().Contain(participant =>
            participant.UserId == pendingUserId &&
            participant.Status == StudentProjectParticipantStatus.Applied);
        result.Participants.Should().NotContain(participant => participant.UserId == anotherPendingUserId);
    }

    [Fact]
    public async Task GetStudentProjectById_WithInvalidId_ShouldThrowNotFoundException()
    {
        // Arrange
        var handler = new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjectById.GetStudentProjectByIdHandler(
            _repository,
            new TestUniversityEventsRepository(),
            new TestUserContextService());

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
            new TestUniversityEventsRepository(),
            new TestUserContextService());

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
    public async Task GetStudentProjects_AsAnonymous_ShouldHidePendingParticipants()
    {
        var projectId = Guid.NewGuid();
        var creatorId = 1L;
        var approvedUserId = 2L;
        var pendingUserId = 3L;

        var project = new StudentProject(projectId, "Public Project", "Description", creatorId, new List<Skill>());

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
            approvedUserId,
            StudentProjectParticipantStatus.Approved,
            false,
            DateTimeOffset.UtcNow);

        var pendingParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            pendingUserId,
            StudentProjectParticipantStatus.Applied,
            false,
            DateTimeOffset.UtcNow);

        project.AddParticipant(creatorParticipant);
        project.AddParticipant(approvedParticipant);
        project.AddParticipant(pendingParticipant);
        await _context.StudentProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        var handler = new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjects.GetStudentProjectsHandler(
            _repository,
            new TestUniversityEventsRepository(),
            new TestUserContextService());

        var result = await handler.Handle(
            new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjects.GetStudentProjectsCommand(),
            CancellationToken.None);

        var projectDto = result.First(dto => dto.Id == projectId);
        projectDto.Participants.Should().OnlyContain(participant => participant.Status == StudentProjectParticipantStatus.Approved);
        projectDto.Participants.Should().NotContain(participant => participant.UserId == pendingUserId);
    }

    [Fact]
    public async Task GetStudentProjects_AsOwner_ShouldIncludePendingParticipants()
    {
        var projectId = Guid.NewGuid();
        var creatorId = 1L;
        var pendingUserId = 2L;

        var project = new StudentProject(
            projectId,
            "Owner View Project",
            "Description",
            creatorId,
            new List<Skill>());

        var creatorParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            creatorId,
            StudentProjectParticipantStatus.Approved,
            true,
            DateTimeOffset.UtcNow);

        var pendingParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            pendingUserId,
            StudentProjectParticipantStatus.Applied,
            false,
            DateTimeOffset.UtcNow);

        project.AddParticipant(creatorParticipant);
        project.AddParticipant(pendingParticipant);
        await _context.StudentProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        var handler = new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjects.GetStudentProjectsHandler(
            _repository,
            new TestUniversityEventsRepository(),
            new TestUserContextService(creatorId));

        var result = await handler.Handle(
            new HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjects.GetStudentProjectsCommand(),
            CancellationToken.None);

        var projectDto = result.First(dto => dto.Id == projectId);
        projectDto.Participants.Should().Contain(participant =>
            participant.UserId == pendingUserId &&
            participant.Status == StudentProjectParticipantStatus.Applied);
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

    [Fact]
    public async Task UpdateParticipantRoles_AsNonCreator_ShouldThrowForbidden()
    {
        var projectId = Guid.NewGuid();
        var creatorId = 1L;
        var outsiderId = 5L;
        var participantUserId = 2L;

        var teamRole = new TeamRole(Guid.NewGuid(), "QA", "Tests things");
        await _repository.AddTeamRoles(new[] { teamRole });
        await _repository.SaveChanges();

        var project = new StudentProject(
            projectId,
            "Roles Restricted Project",
            "Description",
            creatorId,
            new List<Skill>());

        var creatorParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            creatorId,
            StudentProjectParticipantStatus.Approved,
            true,
            DateTimeOffset.UtcNow);

        var participant = new StudentProjectParticipant(
            Guid.NewGuid(),
            projectId,
            participantUserId,
            StudentProjectParticipantStatus.Approved,
            false,
            DateTimeOffset.UtcNow);

        project.AddParticipant(creatorParticipant);
        project.AddParticipant(participant);
        await _context.StudentProjects.AddAsync(project);
        await _context.SaveChangesAsync();

        var handler = new HacatonMax.University.StudentsProject.Application.Commands.UpdateStudentProjectParticipantRoles.UpdateStudentProjectParticipantRolesHandler(
            _repository,
            new TestUserContextService(outsiderId));

        var command = new HacatonMax.University.StudentsProject.Application.Commands.UpdateStudentProjectParticipantRoles.UpdateStudentProjectParticipantRolesCommand(
            projectId,
            participant.Id,
            new List<Guid> { teamRole.Id },
            null);

        await Assert.ThrowsAsync<ForbiddenException>(
            () => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateStudentProject_AsNonCreator_ShouldThrowForbidden()
    {
        var projectId = Guid.NewGuid();
        var creatorId = 1L;
        var outsiderId = 77L;

        var project = new StudentProject(
            projectId,
            "Editable Project",
            "Description",
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

        var handler = new HacatonMax.University.StudentsProject.Application.Commands.UpdateStudentProject.UpdateStudentProjectHandler(
            _repository,
            new TestUniversityEventsRepository(),
            new TestUserContextService(outsiderId));

        var command = new HacatonMax.University.StudentsProject.Application.Commands.UpdateStudentProject.UpdateStudentProjectCommand(
            projectId,
            "New Title",
            "New Description",
            null,
            null);

        await Assert.ThrowsAsync<ForbiddenException>(
            () => handler.Handle(command, CancellationToken.None));
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

internal class TestBotProvider : IBotProvider
{
    public List<Message> SentMessages { get; } = new();

    public Task<IReadOnlyCollection<UpdateEvent>> ReceiveUpdates()
    {
        IReadOnlyCollection<UpdateEvent> updates = Array.Empty<UpdateEvent>();
        return Task.FromResult(updates);
    }

    public Task SendMessage(Message message)
    {
        SentMessages.Add(message);
        return Task.CompletedTask;
    }
}
