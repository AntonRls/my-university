using HacatonMax.University.Library.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.CreateBook;

public record CreateBookCommand(
    string Title,
    string? Description,
    string? Author,
    long Count,
    List<TagDto> Tags) : IRequest;
