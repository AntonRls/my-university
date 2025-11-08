using HacatonMax.Bot.MaxProvider;
using HacatonMax.University.Events.Infrastructure;
using HacatonMax.University.Library.Infrastructure;
using HacatonMax.University.StudentsProject;
using HacatonMax.University.StudentsProject.Infrastructure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.StartMaxBot(builder.Configuration);
builder.Services.AddControllers();
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
});
builder.Services
    .AddUniversityStudentProjectsModule(builder.Configuration)
    .AddUniversityEventsModule(builder.Configuration)
    .AddUniversityLibraryModule(builder.Configuration);
var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();

// Автоматическое применение миграций при старте
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    var libraryDb = services.GetRequiredService<UniversityLibraryDbContext>();
    libraryDb.Database.Migrate();

    var eventsDb = services.GetRequiredService<UniversityEventsDbContext>();
    eventsDb.Database.Migrate();

    var studentsDb = services.GetRequiredService<StudentProjectsDbContext>();
    studentsDb.Database.Migrate();
}


app.Run();
