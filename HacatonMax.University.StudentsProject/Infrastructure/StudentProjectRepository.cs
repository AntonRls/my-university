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

    public async Task<IReadOnlyCollection<StudentProject>> GetProjectsByFilter(List<Guid>? needSkillIds = null)
    {
        if (needSkillIds == null)
        {
            return await _context.StudentProjects.Include(x => x.NeedSkills).AsNoTracking().ToListAsync();
        }

        var projectIds = await _context.SkillStudentProjectDictionary
            .Where(x => needSkillIds.Contains(x.SkillId))
            .AsNoTracking()
            .Select(x => x.StudentProjectId)
            .ToListAsync();

        return await _context.StudentProjects
            .Where(x => projectIds.Contains(x.Id))
            .Include(x => x.NeedSkills)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task Save(StudentProject studentProject)
    {
        var skillsById = studentProject.NeedSkills.ToDictionary(x => x.Id, x => x.Name);
        var existsSkills = await GetExistsSkills(skillsById.Keys.ToArray());
        foreach (var notExistsSkillId in skillsById.Keys.Except(existsSkills.Select(x => x.Id)))
        {
            var skill = new Skill(notExistsSkillId, skillsById[notExistsSkillId]);
            await _context.Skills.AddAsync(skill);
            existsSkills.Add(skill);
        }

        studentProject.UpdateNeedSkills(existsSkills);

        await _context.StudentProjects.AddAsync(studentProject);
        await _context.SaveChangesAsync();
    }

    public async Task<IReadOnlyCollection<Skill>> GetAllSkills()
    {
        return await _context.Skills.AsNoTracking().ToListAsync();
    }

    private Task<List<Skill>> GetExistsSkills(Guid[] skillIds)
    {
        return _context.Skills.Where(x => skillIds.Contains(x.Id)).ToListAsync();
    }
}
