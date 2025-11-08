using HacatonMax.University.Library.Controllers.Dto;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.GetTags;

public class GetTagsHandler : IRequestHandler<GetTagsCommand, List<TagDto>>
{
    private readonly IBookRepository _repository;

    public GetTagsHandler(IBookRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<TagDto>> Handle(GetTagsCommand request, CancellationToken cancellationToken)
    {
        var tags = await _repository.GetTags();
        return tags.Select(x => new TagDto(x.Id, x.Name)).ToList();
    }
}
