// See https://aka.ms/new-console-template for more information
using System.Reflection;
using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.QueryDsl;

namespace Inspector;

internal static class Program
{
    private sealed class BookSearchDocument
    {
    }

    private static void Main()
    {
        PrintType("BoolQueryDescriptor methods:", typeof(BoolQueryDescriptor<BookSearchDocument>));
        PrintConstructors("Field", typeof(Field));
        PrintConstructors("Fields", typeof(Fields));
        PrintMethods("Fields methods", typeof(Fields));
        PrintConstructors("TermsQuery", typeof(TermsQuery));
    }

    private static void PrintType(string title, Type type)
    {
        Console.WriteLine(title);
        foreach (var method in type.GetMethods(BindingFlags.Instance | BindingFlags.Public))
        {
            if (method.Name == "Must")
            {
                Console.WriteLine($"- {method}");
            }
        }
    }

    private static void PrintConstructors(string title, Type type)
    {
        Console.WriteLine($"{title} constructors:");
        foreach (var ctor in type.GetConstructors(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
        {
            Console.WriteLine($"- {ctor}");
        }
    }

    private static void PrintMethods(string title, Type type)
    {
        Console.WriteLine(title);
        foreach (var method in type.GetMethods(BindingFlags.Instance | BindingFlags.Public))
        {
            if (method.Name is "Add" or "AddRange")
            {
                Console.WriteLine($"- {method}");
            }
        }
    }
}
