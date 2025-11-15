using HacatonMax.Common.AuthHelper;
using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.CreateUniversityEvent;

public class CreateUniversityEventHandler : IRequestHandler<CreateUniversityEventCommand>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;
    private readonly IUserContextService _userContextService;

    public CreateUniversityEventHandler(
        IUniversityEventsRepository universityEventsRepository,
        IUserContextService userContextService)
    {
        _universityEventsRepository = universityEventsRepository;
        _userContextService = userContextService;
    }

    public async Task Handle(CreateUniversityEventCommand request, CancellationToken cancellationToken)
    {
        var tagByIds = request.Tags
            .ToDictionary(x => x.Id, x => x.Name);
        var existsTags = await _universityEventsRepository.GetExistsTags(tagByIds.Keys.ToList());

        var addedTags = new List<Tag>();
        foreach (var tagId in tagByIds.Keys.Except(existsTags.Select(x => x.Id)))
        {
            addedTags.Add(new Tag(tagId, tagByIds[tagId]));
        }
        await _universityEventsRepository.SaveTags(addedTags);

        var tags = existsTags.Concat(addedTags);
        var currentUser = _userContextService.GetCurrentUser();

        var universityEvent = new UniversityEvent(
            request.Title,
            request.Description,
            request.Location,
            currentUser.Id,
            request.StartDateTime,
            request.EndDateTime,
            request.ParticipantsLimit,
            tags.ToList());

        await _universityEventsRepository.Save(universityEvent);
    }
}
