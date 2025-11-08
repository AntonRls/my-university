using HacatonMax.Bot.MaxProvider;
using HacatonMax.University.Events.Infrastructure;
using HacatonMax.University.StudentsProject;

var builder = WebApplication.CreateBuilder(args);
builder.Services.StartMaxBot(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services
    .AddUniversityStudentProjectsModule(builder.Configuration)
    .AddUniversityEventsModule(builder.Configuration);

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();
app.Run();
