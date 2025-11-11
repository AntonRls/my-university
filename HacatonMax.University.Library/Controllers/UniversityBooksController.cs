using HacatonMax.University.Library.Application.Commands.CreateBook;
using HacatonMax.University.Library.Application.Commands.GetBooks;
using HacatonMax.University.Library.Application.Commands.GetTags;
using HacatonMax.University.Library.Application.Commands.InvertFavoriteStatusBook;
using HacatonMax.University.Library.Controllers.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Controllers;

[ApiController]
[Route("university-library/books")]
public class UniversityBooksController(IMediator mediator)
{
    [HttpPost]
    [Authorize]
    public Task CreateBook(CreateBookCommand command)
    {
        return mediator.Send(command);
    }

    [HttpGet]
    [Authorize]
    public Task<List<BookDto>> GetBooks([FromQuery] GetBooksCommand command)
    {
        return mediator.Send(command);
    }

    /// <summary>
    /// Инвертировать признак "Избранная книга" у пользователя
    /// </summary>
    [HttpPut("{id:long}/favorite")]
    [Authorize]
    public Task InvertFavoriteBookStatus([FromRoute] long id)
    {
        return mediator.Send(new InvertFavoriteStatusBookCommand(id));
    }

    [HttpGet("tags")]
    [Authorize]
    public Task<List<TagDto>> GetTags()
    {
        return mediator.Send(new GetTagsCommand());
    }
}
