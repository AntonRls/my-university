namespace HacatonMax.University.StudentsProject.Domain;

public interface IStudentProjectsRepository
{
    /// <summary>
    /// Возвращает все проекты студентов или только те, у которых есть указанные скиллы
    /// </summary>
    Task<IReadOnlyCollection<StudentProject>> GetProjectsByFilter(List<Guid>? needSkillIds = null);

    /// <summary>
    /// Сохранить проект
    /// </summary>
    Task Save(StudentProject studentProject);

    /// <summary>
    /// Получить все скиллы
    /// </summary>
    Task<IReadOnlyCollection<Skill>> GetAllSkills();
}
