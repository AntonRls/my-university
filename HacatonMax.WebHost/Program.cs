using System.Text.Json;
using System.Text.Json.Serialization;
using HacatonMax.Bot.MaxProvider;
using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.HangfireProvider;
using HacatonMax.Common.Middleware;
using HacatonMax.Common.Options;
using HacatonMax.WebHost;
using HacatonMax.University.Admin.Infrastructure;
using HacatonMax.University.Events.Infrastructure;
using HacatonMax.University.Library.Infrastructure;
using HacatonMax.University.Structure.Infrastructure;
using HacatonMax.University.Schedule.Infrastructure;
using HacatonMax.University.StudentsProject;
using HacatonMax.University.StudentsProject.Infrastructure;
using HacatonMax.University.StudentsProject.Infrastructure.Seeds;
using HacatonMax.WebHost.Controllers.Dto;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;

var seedOptions = StudentProjectsSeedOptions.Parse(args, out var filteredArgs);

var builder = WebApplication.CreateBuilder(filteredArgs);
builder.Services.Configure<TenantSettings>(builder.Configuration.GetSection(nameof(TenantSettings)));
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
    var structureDocx = Path.Combine(AppContext.BaseDirectory, $"{typeof(HacatonMax.University.Structure.Controllers.StructureController).Assembly.GetName().Name}.xml");
    var scheduleDocx = Path.Combine(AppContext.BaseDirectory, $"{typeof(HacatonMax.University.Schedule.Controllers.GroupScheduleController).Assembly.GetName().Name}.xml");

    c.IncludeXmlComments(libraryDocx, includeControllerXmlComments: true);
    c.IncludeXmlComments(adminDocx, includeControllerXmlComments: true);
    c.IncludeXmlComments(scheduleDocx, includeControllerXmlComments: true);

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Введите JWT токен в формате: Bearer {token}",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
    c.IncludeXmlComments(structureDocx, includeControllerXmlComments: true);
});
builder.Services
    .AddUniversityAdmin(builder.Configuration)
    .AddAuthModule(builder.Configuration)
    .AddUniversityStudentProjectsModule(builder.Configuration)
    .AddUniversityEventsModule(builder.Configuration)
    .AddUniversityLibraryModule(builder.Configuration)
    .AddUniversityStructureModule(builder.Configuration)
    .AddUniversityScheduleModule(builder.Configuration);

builder.Services.AddRequestMetrics();
builder.Services.AddSingleton(seedOptions);
builder.Services.AddScoped<StudentProjectsSeeder>();

var app = builder.Build();
app.MapGet("/", (IOptions<TenantSettings> tenantSettings) => new TenantDto(tenantSettings.Value.UniversityName, tenantSettings.Value.TenantName));
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseRequestMetrics();
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

    var structureDb = services.GetRequiredService<StructureDbContext>();
    structureDb.Database.Migrate();

    var scheduleDb = services.GetRequiredService<ScheduleDbContext>();
    scheduleDb.Database.Migrate();

    if (seedOptions.Enabled)
    {
        var seeder = services.GetRequiredService<StudentProjectsSeeder>();
        await seeder.SeedAsync(seedOptions, CancellationToken.None);
    }
}

app.UseHangfireDashboard();
app.Run("http://0.0.0.0:5099");
