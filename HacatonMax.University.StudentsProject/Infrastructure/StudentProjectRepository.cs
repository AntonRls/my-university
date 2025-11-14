using System;
using System.Collections.Generic;
using System.Linq;
using HacatonMax.University.StudentsProject.Domain;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.StudentsProject.Infrastructure;

internal class StudentProjectRepository : IStudentProjectsRepository
{
    private readonly StudentProjectsDbContext _context;

    public StudentProjectRepository(StudentProjectsDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<StudentProject>> GetProjectsByFilter(
        List<Guid>? needSkillIds = null,
        long? eventId = null)
    {
        IQueryable<StudentProject> query = _context.StudentProjects;

        if (eventId.HasValue)
        {
            query = query.Where(x => x.EventId == eventId.Value);
        }

        if (needSkillIds is { Count: > 0 })
        {
            var projectIds = await _context.SkillStudentProjectDictionary
                .Where(x => needSkillIds.Contains(x.SkillId))
                .AsNoTracking()
                .Select(x => x.StudentProjectId)
                .Distinct()
                .ToListAsync();

            if (projectIds.Count == 0)
            {
                return Array.Empty<StudentProject>();
            }

            query = query.Where(x => projectIds.Contains(x.Id));
        }

        return await query
            .AsSplitQuery()
            .Include(x => x.NeedSkills)
            .Include(x => x.Participants.OrderBy(p => p.CreatedAt))
                .ThenInclude(participant => participant.ParticipantRoles)
                    .ThenInclude(participantRole => participantRole.TeamRole)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task Save(StudentProject studentProject)
    {
        var skillsById = studentProject.NeedSkills.ToDictionary(x => x.Id, x => x.Name);
        var ensuredSkills = await EnsureSkills(skillsById);

        studentProject.UpdateNeedSkills(ensuredSkills);

        await _context.StudentProjects.AddAsync(studentProject);
        await _context.SaveChangesAsync();
    }

    public async Task<IReadOnlyCollection<Skill>> GetAllSkills()
    {
        return await _context.Skills.AsNoTracking().ToListAsync();
    }

    public async Task Update(StudentProject studentProject, Dictionary<Guid, string> requestedSkills)
    {
        var ensuredSkills = await EnsureSkills(requestedSkills);
        studentProject.UpdateNeedSkills(ensuredSkills);

        await _context.SaveChangesAsync();
    }

    public async Task<StudentProject?> GetById(Guid id)
    {
        return await _context.StudentProjects
            .AsSplitQuery()
            .Include(project => project.NeedSkills)
            .Include(project => project.Participants.OrderBy(p => p.CreatedAt))
                .ThenInclude(participant => participant.ParticipantRoles)
                    .ThenInclude(participantRole => participantRole.TeamRole)
            .FirstOrDefaultAsync(project => project.Id == id);
    }

    public Task SaveChanges()
    {
        return _context.SaveChangesAsync();
    }

    public async Task<List<TeamRole>> GetTeamRolesByIds(IEnumerable<Guid> roleIds)
    {
        var ids = roleIds.ToArray();
        if (ids.Length == 0)
        {
            return new List<TeamRole>();
        }

        return await _context.TeamRoles
            .Where(role => ids.Contains(role.Id))
            .ToListAsync();
    }

    public async Task<IReadOnlyCollection<TeamRole>> GetAllTeamRoles()
    {
        return await _context.TeamRoles
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<TeamRole>> GetTeamRolesByNames(IEnumerable<string> names)
    {
        var normalizedNames = names
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name.Trim())
            .ToArray();

        if (normalizedNames.Length == 0)
        {
            return new List<TeamRole>();
        }

        return await _context.TeamRoles
            .Where(role => normalizedNames.Contains(role.Name))
            .ToListAsync();
    }

    public async Task AddTeamRoles(IEnumerable<TeamRole> roles)
    {
        await _context.TeamRoles.AddRangeAsync(roles);
        await _context.SaveChangesAsync();
    }

    private Task<List<Skill>> GetExistsSkills(Guid[] skillIds)
    {
        return _context.Skills.Where(x => skillIds.Contains(x.Id)).ToListAsync();
    }

    private async Task<List<Skill>> EnsureSkills(Dictionary<Guid, string> skillsById)
    {
        if (skillsById.Count == 0)
        {
            return new List<Skill>();
        }

        var existsSkills = await GetExistsSkills(skillsById.Keys.ToArray());
        foreach (var notExistsSkillId in skillsById.Keys.Except(existsSkills.Select(x => x.Id)))
        {
            var skill = new Skill(notExistsSkillId, skillsById[notExistsSkillId]);
            await _context.Skills.AddAsync(skill);
            existsSkills.Add(skill);
        }

        return existsSkills;
    }
}
