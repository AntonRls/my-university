using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.CreateBook;

public class CreateBookHandler : IRequestHandler<CreateBookCommand>
{
    private readonly IBookRepository _bookRepository;

    public CreateBookHandler(IBookRepository bookRepository)
    {
        _bookRepository = bookRepository;
    }

    public async Task Handle(CreateBookCommand request, CancellationToken cancellationToken)
    {
        var tagById = request.Tags.ToDictionary(x => x.Id, x => x.Name);
        var existsTags = await _bookRepository.ExistsTags(tagById.Keys.ToList());
        var existsTagsIds = existsTags.Select(x => x.Id).ToList();

        var addedTags = tagById.Keys
            .Except(existsTagsIds)
            .Select(tagId => new Tag(tagId, tagById[tagId])).ToList();
        await _bookRepository.SaveTags(addedTags);

        var tags = existsTags.Concat(addedTags);

        var book = new Book(
            request.Title,
            request.Description,
            request.Count,
            0,
            tags.ToList(),
            request.Author);

        await _bookRepository.Save(book);
    }
}
