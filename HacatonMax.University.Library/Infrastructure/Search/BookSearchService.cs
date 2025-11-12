using System;
using System.Collections.Generic;
using System.Linq;
using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.QueryDsl;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.Library.Domain;
using HacatonMax.University.Library.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace HacatonMax.University.Library.Infrastructure.Search;

internal sealed class BookSearchService : IBookSearchService
{
    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "и", "в", "на", "с", "по", "для", "от", "до", "из", "к", "о", "об", "про",
        "а", "но", "или", "же", "ли", "бы", "б", "то", "как", "так", "что", "это",
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with"
    };

    private readonly ElasticsearchClient _client;
    private readonly ElasticsearchOptions _options;
    private readonly ILogger<BookSearchService> _logger;

    public BookSearchService(
        ElasticsearchClient client,
        IOptions<ElasticsearchOptions> options,
        ILogger<BookSearchService> logger)
    {
        _client = client;
        _options = options.Value;
        _logger = logger;
    }

    public async Task EnsureIndex()
    {
        if (string.IsNullOrWhiteSpace(_options.IndexName))
        {
            throw new InvalidOperationException("Не задано имя индекса Elasticsearch для поиска книг");
        }

        var existsResponse = await _client.Indices.ExistsAsync(_options.IndexName);
        if (existsResponse.Exists)
        {
            return;
        }

        var createResponse = await _client.Indices.CreateAsync<BookSearchDocument>(_options.IndexName, descriptor => descriptor
            .Settings(settings => settings
                .NumberOfShards(1)
                .NumberOfReplicas(1)));

        if (!createResponse.IsValidResponse)
        {
            _logger.LogError(
                "Не удалось создать индекс {IndexName}: {Error}",
                _options.IndexName,
                createResponse.ElasticsearchServerError?.ToString());
            throw new InvalidOperationException($"Не удалось создать индекс {_options.IndexName} для поиска книг");
        }
    }

    public async Task<bool> Index(Book book)
    {
        var document = MapToDocument(book);

        try
        {
            var response = await _client.IndexAsync(document, descriptor => descriptor
                .Index(_options.IndexName)
                .Id(document.Id));

            if (!response.IsValidResponse)
            {
                _logger.LogError(
                    "Не удалось проиндексировать книгу {BookId} в индекс {IndexName}: {Error}",
                    book.Id,
                    _options.IndexName,
                    response.ElasticsearchServerError?.ToString());
                return false;
            }

            return true;
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Ошибка при индексировании книги {BookId} в индекс {IndexName}",
                book.Id,
                _options.IndexName);
            return false;
        }
    }

    public async Task IndexMany(IReadOnlyCollection<Book> books)
    {
        try
        {
            var deleteResponse = await _client.DeleteByQueryAsync<BookSearchDocument>(_options.IndexName, descriptor => descriptor
                .Query(q => q.MatchAll()));

            if (!deleteResponse.IsValidResponse)
            {
                _logger.LogWarning(
                    "Не удалось очистить индекс {IndexName} перед переиндексацией: {Error}",
                    _options.IndexName,
                    deleteResponse.ElasticsearchServerError?.ToString());
            }
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Ошибка при очистке индекса {IndexName} перед переиндексацией",
                _options.IndexName);
        }

        if (books.Count == 0)
        {
            return;
        }

        foreach (var book in books)
        {
            var indexed = await Index(book);

            if (!indexed)
            {
                _logger.LogWarning(
                    "Не удалось проиндексировать книгу {BookId} во время массовой переиндексации",
                    book.Id);
            }
        }
    }

    public async Task<bool> Remove(long bookId)
    {
        try
        {
            var response = await _client.DeleteAsync<BookSearchDocument>(bookId, descriptor => descriptor
                .Index(_options.IndexName));

            if (!response.IsValidResponse && response.Result != Result.NotFound)
            {
                _logger.LogError(
                    "Не удалось удалить книгу {BookId} из индекса {IndexName}: {Error}",
                    bookId,
                    _options.IndexName,
                    response.ElasticsearchServerError?.ToString());
                return false;
            }

            return true;
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Ошибка при удалении книги {BookId} из индекса {IndexName}",
                bookId,
                _options.IndexName);
            return false;
        }
    }

    public async Task<BookSearchResult> Search(BookSearchRequest request)
    {
        var cleanedQuery = RemoveStopWords(request.Query);
        
        if (string.IsNullOrWhiteSpace(cleanedQuery))
        {
            return new BookSearchResult(
                [],
                0,
                request.Page,
                request.PageSize);
        }

        var mustQueries = new List<Query>
        {
            new Query
            {
                MultiMatch = new MultiMatchQuery
                {
                    Query = cleanedQuery,
                    Fields = new Field[]
                    {
                        new Field("title^3"),
                        new Field("description"),
                        new Field("author^2"),
                        new Field("tags.name^2")
                    },
                    Operator = Operator.Or,
                    Fuzziness = new Fuzziness(2)
                }
            }
        };

        if (request.TagIds is { Count: > 0 } tagIds)
        {
            mustQueries.Add(new Query
            {
                Terms = new TermsQuery
                {
                    Field = new Field("tagIds.keyword"),
                    Terms = new TermsQueryField(tagIds
                        .Select(id => FieldValue.String(id.ToString()))
                        .ToArray())
                }
            });
        }

        var searchRequest = new SearchRequest<BookSearchDocument>(_options.IndexName)
        {
            From = (request.Page - 1) * request.PageSize,
            Size = request.PageSize,
            TrackTotalHits = true,
            Query = new Query
            {
                Bool = new BoolQuery
                {
                    Must = mustQueries
                }
            }
        };

        try
        {
            var response = await _client.SearchAsync<BookSearchDocument>(searchRequest);

            if (!response.IsValidResponse)
            {
                _logger.LogError(
                    "Не удалось выполнить поиск в индексе {IndexName}: {Error}",
                    _options.IndexName,
                    response.ElasticsearchServerError?.ToString());
                throw new ServiceUnavailableException("Поиск книг временно недоступен");
            }

            const double minimumScore = 0.3;
            
            var items = response.Hits
                .Where(hit => hit.Source is not null && (hit.Score ?? 0d) >= minimumScore)
                .Select(hit => MapToResultItem(hit.Source!, hit.Score ?? 0d))
                .ToList();

            var total = response.Total;

            return new BookSearchResult(
                items,
                total,
                request.Page,
                request.PageSize);
        }
        catch (ServiceUnavailableException)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Ошибка при выполнении поиска по индексу {IndexName}",
                _options.IndexName);
            throw new ServiceUnavailableException("Поиск книг временно недоступен");
        }
    }

    private static BookSearchDocument MapToDocument(Book book)
    {
        var tags = book.Tags ?? [];

        return new BookSearchDocument
        {
            Id = book.Id,
            Title = book.Title,
            Description = book.Description,
            Author = book.Author,
            Count = book.Count,
            TakeCount = book.TakeCount,
            TagIds = tags.Select(tag => tag.Id.ToString()).ToList(),
            Tags = tags.Select(tag => new BookSearchTagDocument
            {
                Id = tag.Id,
                Name = tag.Name
            }).ToList()
        };
    }

    private static BookSearchItem MapToResultItem(BookSearchDocument document, double score)
    {
        return new BookSearchItem(
            document.Id,
            document.Title,
            document.Description,
            document.Author,
            document.Count,
            document.TakeCount,
            document.Tags.Select(tag => new Tag(tag.Id, tag.Name)).ToList(),
            score);
    }

    private static string RemoveStopWords(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return string.Empty;
        }

        var words = query.Split([' ', '\t', '\n', '\r'], StringSplitOptions.RemoveEmptyEntries);
        var filteredWords = words
            .Where(word => !StopWords.Contains(word.Trim()))
            .Where(word => word.Trim().Length > 1);

        return string.Join(" ", filteredWords);
    }
}

internal sealed class BookSearchDocument
{
    public long Id { get; init; }

    public string Title { get; init; } = string.Empty;

    public string? Description { get; init; }

    public string? Author { get; init; }

    public long Count { get; init; }

    public long TakeCount { get; init; }

    public List<string> TagIds { get; init; } = [];

    public List<BookSearchTagDocument> Tags { get; init; } = [];
}

internal sealed class BookSearchTagDocument
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;
}

