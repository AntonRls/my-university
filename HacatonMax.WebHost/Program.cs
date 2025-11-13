using System.Text.Json;
using System.Text.Json.Serialization;
using HacatonMax.Bot.MaxProvider;
using HacatonMax.Common.HangfireProvider;
using HacatonMax.Common.Middleware;
using HacatonMax.University.Admin.Infrastructure;
using HacatonMax.University.Auth;
using HacatonMax.University.Events.Infrastructure;
using HacatonMax.University.Library.Infrastructure;
using HacatonMax.University.StudentsProject;
using HacatonMax.University.StudentsProject.Infrastructure;
using Hangfire;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(x =>
{
    x.AddPolicy("AllowAll",
        policy =>
            policy
                .AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader());
});

builder.Services.StartMaxBot(builder.Configuration);
builder.Services.AddHangfireProvider(builder.Configuration);
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.SnakeCaseLower;
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.CustomSchemaIds(type =>
    {
        if (type == typeof(HacatonMax.University.Library.Controllers.Dto.TagDto))
            return "LibraryTagDto";
        if (type == typeof(HacatonMax.University.Events.Controllers.Dto.TagDto))
            return "EventsTagDto";
        return type.Name;
    });

    var libraryDocx = Path.Combine(AppContext.BaseDirectory, $"{typeof(HacatonMax.University.Library.Controllers.UniversityBooksController).Assembly.GetName().Name}.xml");
    var adminDocx = Path.Combine(AppContext.BaseDirectory, $"{typeof(HacatonMax.University.Admin.Controllers.AdminController).Assembly.GetName().Name}.xml");

    c.IncludeXmlComments(libraryDocx, includeControllerXmlComments: true);
    c.IncludeXmlComments(adminDocx, includeControllerXmlComments: true);
});
builder.Services
    .AddUniversityAdmin(builder.Configuration)
    .AddAuthModule(builder.Configuration)
    .AddUniversityStudentProjectsModule(builder.Configuration)
    .AddUniversityEventsModule(builder.Configuration)
    .AddUniversityLibraryModule(builder.Configuration);

var app = builder.Build();
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    var libraryDb = services.GetRequiredService<UniversityLibraryDbContext>();
    libraryDb.Database.Migrate();

    var eventsDb = services.GetRequiredService<UniversityEventsDbContext>();
    eventsDb.Database.Migrate();

    var studentProjectsDb = services.GetRequiredService<StudentProjectsDbContext>();
    studentProjectsDb.Database.Migrate();

    var adminDb = services.GetRequiredService<AdminDbContext>();
    adminDb.Database.Migrate();
}

app.UseHangfireDashboard();
app.Run("http://0.0.0.0:5099");
