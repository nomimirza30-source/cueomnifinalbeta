using SnookerTableManagement.Infrastructure;
using SnookerTableManagement.Infrastructure.Hubs;
using SnookerTableManagement.Infrastructure.Persistence;
using SnookerTableManagement.Core.Domain.Entities;
using SnookerTableManagement.Core.Domain.Enums;
using SnookerTableManagement.Core.Domain.Constants;
using Microsoft.EntityFrameworkCore;

using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options => 
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddOpenApi();

// Infrastructure registration
builder.Services.AddInfrastructure(builder.Configuration);

// SignalR registration
builder.Services.AddSignalR();

// CORS for React PWA
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5200", "http://localhost:5202")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Auto-Seeding Tables
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<SnookerDbContext>();
    context.Database.EnsureCreated();
    if (!context.Tables.Any())
    {
        foreach (var entry in TableConstants.FixedTableIds)
        {
            context.Tables.Add(new SnookerTable 
            { 
                Id = entry.Value, 
                TableNumber = entry.Key, 
                Status = TableStatus.Available,
                HourlyRate = 10.00m
            });
        }
        context.SaveChanges();
    }

    // Auto-Seeding Standard Rate (with deduplication)
    var standardRateId = Guid.Parse("f8a7e0e0-0e0e-4e0e-8e0e-0e0e0e0e0e0e");
    
    // Remove any non-standard rates to prevent duplicates
    var extraRates = context.Rates.Where(r => r.Id != standardRateId).ToList();
    if (extraRates.Any())
    {
        context.Rates.RemoveRange(extraRates);
        context.SaveChanges();
    }

    if (!context.Rates.Any(r => r.Id == standardRateId))
    {
        context.Rates.Add(new Rate
        {
            Id = standardRateId,
            Name = "Standard Rate",
            AmountPerHour = 10.00m,
            IsDefault = true
        });
        context.SaveChanges();
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseHttpsRedirection();
app.UseCors();
app.UseAuthorization();

app.MapControllers();

// Map SignalR Hub
app.MapHub<TableHub>("/hubs/tables");

app.Run();
