using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Bogus;
using HacatonMax.University.StudentsProject.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HacatonMax.University.StudentsProject.Infrastructure.Seeds;

public sealed class StudentProjectsSeeder
{
    private static readonly Faker Faker = new("ru");
    private readonly StudentProjectsDbContext _dbContext;
    private readonly ILogger<StudentProjectsSeeder> _logger;

    public StudentProjectsSeeder(StudentProjectsDbContext dbContext, ILogger<StudentProjectsSeeder> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task SeedAsync(StudentProjectsSeedOptions options, CancellationToken cancellationToken)
    {
        if (!options.Enabled)
        {
            return;
        }

        _logger.LogInformation("Student projects seeding started. Target projects: {Projects}", options.ProjectCount);

        if (options.ForceReset)
        {
            await ResetDatabaseAsync(cancellationToken);
        }

        var currentProjects = await _dbContext.StudentProjects.CountAsync(cancellationToken);
        if (!options.ForceReset && currentProjects >= options.ProjectCount)
        {
            _logger.LogInformation("Database already contains {Current} projects (target {Target}). Skipping seeding.", currentProjects, options.ProjectCount);
            return;
        }

        var skillsPool = await EnsureSkillsAsync(options.SkillPoolSize, cancellationToken);
        var teamRolesPool = await EnsureTeamRolesAsync(options.TeamRolesPoolSize, cancellationToken);

        var projectsToCreate = options.ProjectCount - currentProjects;
        if (projectsToCreate <= 0)
        {
            _logger.LogInformation("Nothing to seed: current {Current} >= target {Target}", currentProjects, options.ProjectCount);
            return;
        }

        var random = Random.Shared;
        var buffer = new List<StudentProject>(capacity: 200);

        for (var i = 0; i < projectsToCreate; i++)
        {
            var project = CreateProject(skillsPool, teamRolesPool, options.MaxParticipantsPerProject, random);
            buffer.Add(project);

            if (buffer.Count >= 200)
            {
                await PersistBatchAsync(buffer, cancellationToken);
                buffer.Clear();
            }
        }

        if (buffer.Count > 0)
        {
            await PersistBatchAsync(buffer, cancellationToken);
        }

        _logger.LogInformation("Student projects seeding finished. Total projects: {Total}", await _dbContext.StudentProjects.CountAsync(cancellationToken));
    }

    private StudentProject CreateProject(List<Skill> skillsPool, List<TeamRole> teamRolesPool, int maxParticipantsPerProject, Random random)
    {
        var creatorId = random.NextInt64(1_000, 999_999_999);
        var title = Faker.Company.CatchPhrase();
        var description = Faker.Lorem.Paragraphs(2);
        var needSkills = skillsPool
            .OrderBy(_ => random.NextDouble())
            .Take(random.Next(4, Math.Min(12, skillsPool.Count)))
            .ToList();

        var studentProject = new StudentProject(Guid.NewGuid(), title, description, creatorId, needSkills);

        var createdAt = Faker.Date.BetweenOffset(DateTimeOffset.UtcNow.AddMonths(-6), DateTimeOffset.UtcNow);
        var creatorParticipant = new StudentProjectParticipant(
            Guid.NewGuid(),
            studentProject.Id,
            creatorId,
            StudentProjectParticipantStatus.Approved,
            true,
            createdAt);
        creatorParticipant.SetParticipantRoles(CreateRolesForParticipant(teamRolesPool, creatorParticipant.Id, random));
        studentProject.AddParticipant(creatorParticipant);

        var participantsCount = random.Next(5, Math.Max(6, maxParticipantsPerProject + 1));
        for (var i = 0; i < participantsCount; i++)
        {
            var userId = random.NextInt64(1_000, 9_000_000_000);
            if (studentProject.Participants.Any(p => p.UserId == userId))
            {
                i--;
                continue;
            }

            var status = (StudentProjectParticipantStatus)random.Next(0, Enum.GetValues<StudentProjectParticipantStatus>().Length);
            var participant = new StudentProjectParticipant(
                Guid.NewGuid(),
                studentProject.Id,
                userId,
                status,
                false,
                createdAt.AddMinutes(random.Next(1, 20_000)));
            participant.SetParticipantRoles(CreateRolesForParticipant(teamRolesPool, participant.Id, random));
            studentProject.AddParticipant(participant);
        }

        return studentProject;
    }

    private static List<StudentProjectParticipantRole> CreateRolesForParticipant(List<TeamRole> teamRolesPool, Guid participantId, Random random)
    {
        var roleCount = random.Next(0, Math.Min(3, teamRolesPool.Count));
        if (roleCount == 0)
        {
            return new List<StudentProjectParticipantRole>();
        }

        var selectedRoles = teamRolesPool
            .OrderBy(_ => random.NextDouble())
            .Take(roleCount)
            .ToList();

        return selectedRoles
            .Select(role => new StudentProjectParticipantRole(Guid.NewGuid(), participantId, role.Id))
            .ToList();
    }

    private async Task PersistBatchAsync(List<StudentProject> projects, CancellationToken cancellationToken)
    {
        await _dbContext.StudentProjects.AddRangeAsync(projects, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded batch of {Count} projects", projects.Count);
    }

    private async Task<List<Skill>> EnsureSkillsAsync(int desiredCount, CancellationToken cancellationToken)
    {
        var skills = await _dbContext.Skills.AsTracking().ToListAsync(cancellationToken);
        if (skills.Count >= desiredCount)
        {
            return skills;
        }

        var missing = desiredCount - skills.Count;
        for (var i = 0; i < missing; i++)
        {
            skills.Add(new Skill(Guid.NewGuid(), $"Skill {skills.Count + 1 + i}: {Faker.Hacker.Noun()}"));
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Ensured skill pool size: {Count}", skills.Count);
        return skills;
    }

    private async Task<List<TeamRole>> EnsureTeamRolesAsync(int desiredCount, CancellationToken cancellationToken)
    {
        var roles = await _dbContext.TeamRoles.AsTracking().ToListAsync(cancellationToken);
        if (roles.Count >= desiredCount)
        {
            return roles;
        }

        var missing = desiredCount - roles.Count;
        for (var i = 0; i < missing; i++)
        {
            roles.Add(new TeamRole(Guid.NewGuid(), $"Role {roles.Count + 1 + i}", Faker.Name.JobDescriptor()));
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Ensured team roles pool size: {Count}", roles.Count);
        return roles;
    }

    private async Task ResetDatabaseAsync(CancellationToken cancellationToken)
    {
        _logger.LogWarning("Force reset enabled. Truncating student project tables...");
        await _dbContext.Database.ExecuteSqlRawAsync(@"
            TRUNCATE TABLE
                ""students-projects"".""student_project_participant_roles"",
                ""students-projects"".""student_project_participants"",
                ""students-projects"".""student_projects"",
                ""students-projects"".""skill_student_projects"",
                ""students-projects"".""skills"",
                ""students-projects"".""team_roles""
            RESTART IDENTITY CASCADE;", cancellationToken);
    }
}
