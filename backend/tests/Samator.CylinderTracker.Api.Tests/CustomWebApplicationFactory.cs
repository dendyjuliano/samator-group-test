using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Samator.CylinderTracker.Api.Data;
using Samator.CylinderTracker.Api.Entities;

namespace Samator.CylinderTracker.Api.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"cylinders-test-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Default", $"Data Source={_dbPath}");
    }

    /// <summary>Replaces all rows with a small, deterministic fixture so list/search/pagination tests are stable.</summary>
    public async Task SeedAsync(params Cylinder[] cylinders)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Cylinders.RemoveRange(db.Cylinders);
        await db.SaveChangesAsync();
        db.Cylinders.AddRange(cylinders);
        await db.SaveChangesAsync();
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (File.Exists(_dbPath))
        {
            File.Delete(_dbPath);
        }
    }
}
