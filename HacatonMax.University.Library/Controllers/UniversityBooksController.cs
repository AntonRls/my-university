using HacatonMax.University.Library.Application.Commands.CreateBook;
using HacatonMax.University.Library.Application.Commands.GetBookById;
using HacatonMax.University.Library.Application.Commands.GetBooks;
using HacatonMax.University.Library.Application.Commands.GetFavoriteBooks;
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
    public Task CreateBook(CreateBookCommand command)
    {
        return mediator.Send(command);
    }

    [HttpGet]
    public Task<List<BookDto>> GetBooks([FromQuery] GetBooksCommand command)
    {
        return mediator.Send(command);
    }

    [HttpGet("{id:long}")]
    public Task<BookDto> GetBook([FromRoute] long id)
    {
        return mediator.Send(new GetBookByIdCommand(id));
    }

    /// <summary>
    /// Инвертировать признак "Избранная книга" у пользователя
    /// </summary>
    [HttpPut("{id:long}/favorite")]
    public Task InvertFavoriteBookStatus([FromRoute] long id)
    {
        return mediator.Send(new InvertFavoriteStatusBookCommand(id));
    }

    [HttpGet("favorites")]
    public Task<List<BookDto>> GetFavoritesBook()
    {
        return mediator.Send(new GetFavoriteBooksCommand());
    }

    [HttpGet("tags")]
    public Task<List<TagDto>> GetTags()
    {
        return mediator.Send(new GetTagsCommand());
    }
}
