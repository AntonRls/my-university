using HacatonMax.Bot.MaxProvider;
using HacatonMax.Common.HangfireProvider;
using HacatonMax.University.Auth;
using HacatonMax.University.Events.Infrastructure;
using HacatonMax.University.Library.Infrastructure;
using HacatonMax.University.StudentsProject;
using HacatonMax.University.StudentsProject.Infrastructure;
using Hangfire;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.StartMaxBot(builder.Configuration);
builder.Services.AddHangfireProvider(builder.Configuration);
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

    var libraryDocx = Path.Combine(AppContext.BaseDirectory, $"{typeof(HacatonMax.University.Library.Controllers.UniversityBooksController).Assembly.GetName().Name}.xml");

    c.IncludeXmlComments(libraryDocx, includeControllerXmlComments: true);
});
builder.Services
    .AddAuthModule(builder.Configuration)
    .AddUniversityStudentProjectsModule(builder.Configuration)
    .AddUniversityEventsModule(builder.Configuration)
    .AddUniversityLibraryModule(builder.Configuration);
builder.Services.AddCors(x =>
{
    x.AddPolicy("AllowAll", policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});
var app = builder.Build();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
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

app.UseHangfireDashboard();
app.Run();
