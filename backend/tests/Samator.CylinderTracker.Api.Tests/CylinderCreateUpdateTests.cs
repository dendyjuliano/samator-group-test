using System.Net;
using System.Net.Http.Json;
using Samator.CylinderTracker.Api.Dtos;
using Samator.CylinderTracker.Api.Entities;

namespace Samator.CylinderTracker.Api.Tests;

public class CylinderCreateUpdateTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CylinderCreateUpdateTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Create_ReturnsCreated_WithStatusEmptyAndNoCustomer_AndNormalizesSerialToUppercase()
    {
        await _factory.SeedAsync();
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/cylinders", new { serialNumber = "cyl-555001", gasType = "Nitrogen" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<CylinderResponse>(TestJson.Options);
        Assert.NotNull(created);
        Assert.Equal("CYL-555001", created!.SerialNumber);
        Assert.Equal("Empty", created.Status);
        Assert.Null(created.CustomerName);
    }

    [Fact]
    public async Task Create_ReturnsConflict_ForDuplicateSerial_CaseInsensitive()
    {
        await _factory.SeedAsync(new Cylinder
        {
            Id = 1,
            SerialNumber = "CYL-555002",
            GasType = "Oxygen",
            Status = "Empty",
            LastUpdated = DateTime.UtcNow,
        });
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/cylinders", new { serialNumber = "cyl-555002", gasType = "Oxygen" });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Theory]
    [InlineData("CYL-5", "Oxygen")]       // too few digits
    [InlineData("CYL-5550099", "Oxygen")] // too many digits
    [InlineData("CYL-555003", "Helium")]  // gas type not in allow-list
    public async Task Create_ReturnsBadRequest_ForInvalidSerialOrGasType(string serial, string gasType)
    {
        await _factory.SeedAsync();
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/cylinders", new { serialNumber = serial, gasType });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Update_ReturnsNotFound_ForMissingCylinder()
    {
        await _factory.SeedAsync();
        var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync("/api/cylinders/9999", new { serialNumber = "CYL-555004", gasType = "Oxygen" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Update_DoesNotChangeStatus_AndReturnsOk()
    {
        await _factory.SeedAsync(new Cylinder
        {
            Id = 42,
            SerialNumber = "CYL-555005",
            GasType = "Oxygen",
            Status = "Filled",
            LastUpdated = DateTime.UtcNow.AddDays(-1),
        });
        var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync("/api/cylinders/42", new { serialNumber = "CYL-555006", gasType = "Argon" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<CylinderResponse>(TestJson.Options);
        Assert.Equal("CYL-555006", updated!.SerialNumber);
        Assert.Equal("Argon", updated.GasType);
        Assert.Equal("Filled", updated.Status);
    }
}
