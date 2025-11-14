using System;
using System.Collections.Generic;

namespace HacatonMax.University.StudentsProject.Domain;

public interface IStudentProjectsRepository
{
    /// <summary>
    /// Возвращает все проекты студентов или только те, у которых есть указанные скиллы
    /// </summary>
    Task<IReadOnlyCollection<StudentProject>> GetProjectsByFilter(
        List<Guid>? needSkillIds = null,
        long? eventId = null);

    /// <summary>
    /// Сохранить проект
    /// </summary>
    Task Save(StudentProject studentProject);

    Task Update(StudentProject studentProject, Dictionary<Guid, string> requestedSkills);

    /// <summary>
    /// Получить все скиллы
    /// </summary>
    Task<IReadOnlyCollection<Skill>> GetAllSkills();

    Task<StudentProject?> GetById(Guid id);

    Task SaveChanges();

    Task<List<TeamRole>> GetTeamRolesByIds(IEnumerable<Guid> roleIds);

    Task<IReadOnlyCollection<TeamRole>> GetAllTeamRoles();

    Task<List<TeamRole>> GetTeamRolesByNames(IEnumerable<string> names);

    Task AddTeamRoles(IEnumerable<TeamRole> roles);

    Task AddParticipant(StudentProjectParticipant participant);

    Task RemoveParticipantRoles(Guid participantId);

    Task UpdateParticipantRoles(Guid participantId, List<StudentProjectParticipantRole> newRoles);
}
