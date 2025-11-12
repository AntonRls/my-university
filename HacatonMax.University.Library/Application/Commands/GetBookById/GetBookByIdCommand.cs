using HacatonMax.University.Library.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.GetBookById;

public record GetBookByIdCommand(long Id)  : IRequest<BookDto>;
