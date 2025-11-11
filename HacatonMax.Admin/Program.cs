using System.Text.Json;
using HacatonMax.Admin.Infrastructure;

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
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.SnakeCaseLower;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAdminInfrastructure(builder.Configuration);

var app = builder.Build();
app.UseCors("AllowAll");
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();
app.Run("http://0.0.0.0:5001");
