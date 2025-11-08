using HacatonMax.University.Library.Application.Commands.CreateBook;
using HacatonMax.University.Library.Application.Commands.GetBooks;
using HacatonMax.University.Library.Application.Commands.GetTags;
using HacatonMax.University.Library.Controllers.Dto;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Controllers;

[ApiController]
[Route("university-library")]
public class UniversityLibraryController(IMediator mediator)
{
    [HttpPost]
    public Task CreateBook(CreateBookCommand command)
    {
        return mediator.Send(command);
    }

    [HttpGet]
    public Task<List<BookDto>> GetBooks([FromQuery] GetBooksCommand command)
    {
        return mediator.Send(command);
    }

    [HttpGet("tags")]
    public Task<List<TagDto>> GetTags()
    {
        return mediator.Send(new GetTagsCommand());
    }
}
