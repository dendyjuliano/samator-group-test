using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Samator.CylinderTracker.Api.Entities;

namespace Samator.CylinderTracker.Api.Data;

public static class DataSeeder
{
    private sealed class SeedRecord
    {
        [JsonPropertyName("serialNumber")]
        public string SerialNumber { get; set; } = string.Empty;

        [JsonPropertyName("gasType")]
        public string GasType { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("customerName")]
        public string? CustomerName { get; set; }

        [JsonPropertyName("lastUpdated")]
        public DateTime LastUpdated { get; set; }
    }

    public static async Task SeedAsync(AppDbContext db, string seedFilePath)
    {
        if (await db.Cylinders.AnyAsync())
        {
            return;
        }

        if (!File.Exists(seedFilePath))
        {
            return;
        }

        var json = await File.ReadAllTextAsync(seedFilePath);
        var records = JsonSerializer.Deserialize<List<SeedRecord>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        }) ?? new List<SeedRecord>();

        var seenSerials = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var cylinders = new List<Cylinder>();

        foreach (var record in records)
        {
            var normalizedSerial = record.SerialNumber.Trim().ToUpperInvariant();
            if (!seenSerials.Add(normalizedSerial))
            {
                // Defensive: skip duplicate serials if the seed data ever contains one.
                continue;
            }

            cylinders.Add(new Cylinder
            {
                SerialNumber = normalizedSerial,
                GasType = record.GasType,
                Status = record.Status,
                CustomerName = record.Status == Domain.CylinderStatuses.Delivered ? record.CustomerName : null,
                LastUpdated = DateTime.SpecifyKind(record.LastUpdated, DateTimeKind.Utc),
            });
        }

        db.Cylinders.AddRange(cylinders);
        await db.SaveChangesAsync();
    }
}
