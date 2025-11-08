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
        var existsSkills = await GetExistsSkills(studentProject.NeedSkills.Select(x => x.Id).ToArray());
        foreach (var notExistsSkills in studentProject.NeedSkills.Except(existsSkills))
        {
            await _context.Skills.AddAsync(notExistsSkills);
            existsSkills.Add(notExistsSkills);
        }

        foreach (var skill in existsSkills)
        {
            await _context.SkillStudentProjectDictionary.AddAsync(new SkillStudentProject
            {
                SkillId = skill.Id,
                StudentProjectId = studentProject.Id,
            });
        }

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
