using HacatonMax.University.StudentsProject.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.StudentsProject.Application.Commands.GetAllSkills;

public record GetAllSkillsCommand : IRequest<List<SkillDto>>;
