using System.Linq;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.Events.Application.Services;
using HacatonMax.University.Events.Controllers.Dto;
using HacatonMax.University.Events.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.UpdateUniversityEvent;

public sealed class UpdateUniversityEventHandler : IRequestHandler<UpdateUniversityEventCommand>
{
    private readonly IUniversityEventsRepository _universityEventsRepository;
    private readonly IUniversityEventReminderScheduler _reminderScheduler;

    public UpdateUniversityEventHandler(
        IUniversityEventsRepository universityEventsRepository,
        IUniversityEventReminderScheduler reminderScheduler)
    {
        _universityEventsRepository = universityEventsRepository;
        _reminderScheduler = reminderScheduler;
    }

    public async Task Handle(UpdateUniversityEventCommand request, CancellationToken cancellationToken)
    {
        var universityEvent = await _universityEventsRepository.GetById(request.EventId);

        if (universityEvent == null)
        {
            throw new NotFoundException($"Событие с ID {request.EventId} не найдено");
        }

        var tags = await ResolveTags(request.Tags);

        universityEvent.Update(
            request.Title,
            request.Description,
            request.Location,
            request.StartDateTime,
            request.EndDateTime,
            request.ParticipantsLimit,
            tags);

        await _universityEventsRepository.SaveChanges();
        await _reminderScheduler.RescheduleForEvent(universityEvent, universityEvent.Registrations, cancellationToken);
    }

    private async Task<List<Tag>> ResolveTags(List<TagDto> requestTags)
    {
        var tagById = requestTags.ToDictionary(tag => tag.Id, tag => tag.Name);
        var existingTags = await _universityEventsRepository.GetExistsTags(tagById.Keys.ToList());
        var existingTagIds = existingTags.Select(tag => tag.Id).ToHashSet();

        var newTags = tagById.Keys
            .Except(existingTagIds)
            .Select(tagId => new Tag(tagId, tagById[tagId]))
            .ToList();

        if (newTags.Count > 0)
        {
            await _universityEventsRepository.SaveTags(newTags);
        }

        return existingTags.Concat(newTags).ToList();
    }
}

