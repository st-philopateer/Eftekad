using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Eftekad.Backend.Data;
using Eftekad.Backend.Models;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://localhost:3000");

// Configure CORS to allow everything
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure SQLite Connection
var dbPath = Path.Combine(Directory.GetCurrentDirectory(), "eftekad.db");
builder.Services.AddDbContext<EftekadDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// Enable Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Maintain standard camelCase property naming
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    });

var app = builder.Build();

// Enable Middlewares
app.UseCors();
app.UseRouting();

// 1. Serve Uploaded Files statically
var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

// 2. Serve SPA static files (React production build in front/dist)
var spaPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "front", "dist");
if (Directory.Exists(spaPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(spaPath),
        RequestPath = ""
    });
}
else
{
    Console.WriteLine($"⚠️ Warning: SPA build folder '{spaPath}' does not exist yet. Run 'npm run build' to bundle the frontend.");
}

app.MapControllers();

// 3. SPA Fallback Routing: Redirect all non-API and non-file requests to index.html
app.MapFallbackToFile("index.html", new StaticFileOptions
{
    FileProvider = Directory.Exists(spaPath) ? new PhysicalFileProvider(spaPath) : new PhysicalFileProvider(Directory.GetCurrentDirectory())
});

// Initialize & Seed Database at Startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<EftekadDbContext>();
    
    // Ensure SQLite database and tables exist
    context.Database.EnsureCreated();
    Console.WriteLine($"🔌 Database initialized at: {dbPath}");

    // Clean up old auto-seeded stages if they exist
    var oldSeeded = context.StageLists.Where(s => s.Id != null && s.Id.StartsWith("stage_")).ToList();
    if (oldSeeded.Any())
    {
        context.StageLists.RemoveRange(oldSeeded);
        context.SaveChanges();
        Console.WriteLine("🧹 Cleaned up old auto-seeded stages.");
    }

    // Seed Default Super Admin Account (from db.json specs)
    if (!context.Users.Any(u => u.Role == "super_admin" || u.Username == "superadmin"))
    {
        var superAdmin = new User
        {
            Id = "sa0001",
            Name = "السوبر أدمن الرئيسي",
            Username = "superadmin",
            Password = "superadmin123", // plaintext password matching previous spec
            Role = "super_admin",
            Church = "الرئاسة العامة",
            Email = "superadmin@church.com",
            Status = "active"
        };
        context.Users.Add(superAdmin);
        Console.WriteLine("👤 Default Super Admin account auto-seeded successfully!");
    }

    // Seed Active Service Year
    var currentYear = DateTime.UtcNow.Year.ToString();
    if (!context.ServiceYears.Any(y => y.Year == currentYear))
    {
        context.ServiceYears.Add(new ServiceYear { Year = currentYear, IsActive = true });
    }

    context.SaveChanges();

    // Execute Monthly Waznat Rotation (on startup)
    try
    {
        var rotationKey = $"{DateTime.UtcNow.Year}-{DateTime.UtcNow.Month:D2}";
        var lastRot = context.SystemMetas.FirstOrDefault(m => m.Key == "last_waznat_rotation_month");
        if (lastRot == null || lastRot.ValueJson != rotationKey)
        {
            Console.WriteLine($"[Waznat Rotation] Starting automated monthly rotation for key {rotationKey}...");
            var trees = context.ServiceTrees.ToList();
            foreach (var t in trees)
            {
                try
                {
                    var osrasNode = JsonNode.Parse(t.OsrasJson);
                    if (osrasNode is JsonArray osrasArray)
                    {
                        foreach (var osra in osrasArray)
                        {
                            var osraName = osra?["name"]?.ToString() ?? string.Empty;
                            if (osra?["stages"] is JsonArray stagesArray)
                            {
                                foreach (var stage in stagesArray)
                                {
                                    var stageName = stage?["name"]?.ToString() ?? string.Empty;
                                    if (stage?["classes"] is JsonArray classesArray)
                                    {
                                        foreach (var cls in classesArray)
                                        {
                                            var className = cls?["name"]?.ToString() ?? string.Empty;
                                            var servants = new List<string>();
                                            if (cls?["servants"] is JsonArray servantsArray)
                                            {
                                                servants = servantsArray.Select(s => s?.ToString() ?? string.Empty).Where(s => !string.IsNullOrEmpty(s)).ToList();
                                            }

                                            if (servants.Count > 1)
                                            {
                                                var members = context.Makhdomeen.Where(m =>
                                                    m.Osra == osraName &&
                                                    m.Stage == stageName &&
                                                    m.Fasl == className &&
                                                    m.Status == "active").ToList();

                                                if (members.Count > 0)
                                                {
                                                    for (int i = 0; i < members.Count; i++)
                                                    {
                                                        var assigned = servants[i % servants.Count];
                                                        members[i].AssignedServant = assigned;
                                                        members[i].UpdatedAt = DateTime.UtcNow;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error during round-robin waznat rotation check: " + ex.Message);
                }
            }

            if (lastRot == null)
            {
                context.SystemMetas.Add(new SystemMeta { Key = "last_waznat_rotation_month", ValueJson = rotationKey });
            }
            else
            {
                lastRot.ValueJson = rotationKey;
                lastRot.UpdatedAt = DateTime.UtcNow;
            }
            context.SaveChanges();
            Console.WriteLine("[Waznat Rotation] Automated rotation completed successfully!");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("Waznat rotation error: " + ex.Message);
    }
}

Console.WriteLine("==================================================");
Console.WriteLine("🚀 .NET C# Web API successfully running on port 3000!");
Console.WriteLine("🔗 Link: http://localhost:3000/");
Console.WriteLine("==================================================");

app.Run();
