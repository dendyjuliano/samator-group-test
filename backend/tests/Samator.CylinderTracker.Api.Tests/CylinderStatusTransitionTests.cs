using System.Net;
using System.Net.Http.Json;
using Samator.CylinderTracker.Api.Dtos;
using Samator.CylinderTracker.Api.Entities;

namespace Samator.CylinderTracker.Api.Tests;

public class CylinderStatusTransitionTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CylinderStatusTransitionTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ChangeStatus_FilledToDelivered_RequiresAndStoresCustomerName()
    {
        await _factory.SeedAsync(new Cylinder
        {
            Id = 1,
            SerialNumber = "CYL-600001",
            GasType = "Oxygen",
            Status = "Filled",
            LastUpdated = DateTime.UtcNow.AddHours(-1),
        });
        var client = _factory.CreateClient();

        var missingCustomer = await client.PostAsJsonAsync("/api/cylinders/1/status", new { status = "Delivered" });
        Assert.Equal(HttpStatusCode.BadRequest, missingCustomer.StatusCode);

        var response = await client.PostAsJsonAsync("/api/cylinders/1/status", new { status = "Delivered", customerName = "PT Sinar O'Brien Medika" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var updated = await response.Content.ReadFromJsonAsync<CylinderResponse>(TestJson.Options);
        Assert.Equal("Delivered", updated!.Status);
        Assert.Equal("PT Sinar O'Brien Medika", updated.CustomerName);
    }

    [Theory]
    [InlineData("Retired", "Filled")]
    [InlineData("Delivered", "InMaintenance")]
    [InlineData("Empty", "Delivered")]
    public async Task ChangeStatus_RejectsDisallowedTransitions(string fromStatus, string toStatus)
    {
        await _factory.SeedAsync(new Cylinder
        {
            Id = 2,
            SerialNumber = "CYL-600002",
            GasType = "Argon",
            Status = fromStatus,
            CustomerName = fromStatus == "Delivered" ? "Some Customer" : null,
            LastUpdated = DateTime.UtcNow.AddHours(-1),
        });
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/cylinders/2/status", new { status = toStatus, customerName = "Some Customer" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ChangeStatus_DeliveredToEmpty_ClearsCustomerName()
    {
        await _factory.SeedAsync(new Cylinder
        {
            Id = 3,
            SerialNumber = "CYL-600003",
            GasType = "Hydrogen",
            Status = "Delivered",
            CustomerName = "PT Maju Jaya Abadi",
            LastUpdated = DateTime.UtcNow.AddHours(-1),
        });
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/cylinders/3/status", new { status = "Empty" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<CylinderResponse>(TestJson.Options);
        Assert.Equal("Empty", updated!.Status);
        Assert.Null(updated.CustomerName);
    }

    [Fact]
    public async Task ChangeStatus_ToDelivered_Allows120CharCustomerName_ButRejects121()
    {
        await _factory.SeedAsync(new Cylinder
        {
            Id = 4,
            SerialNumber = "CYL-600004",
            GasType = "Nitrogen",
            Status = "Filled",
            LastUpdated = DateTime.UtcNow.AddHours(-1),
        });
        var client = _factory.CreateClient();

        var exactly120 = new string('A', 120);
        var okResponse = await client.PostAsJsonAsync("/api/cylinders/4/status", new { status = "Delivered", customerName = exactly120 });
        Assert.Equal(HttpStatusCode.OK, okResponse.StatusCode);
        var updated = await okResponse.Content.ReadFromJsonAsync<CylinderResponse>(TestJson.Options);
        Assert.Equal(120, updated!.CustomerName!.Length);

        // Move back to Filled so a second Delivered transition is valid to attempt.
        await client.PostAsJsonAsync("/api/cylinders/4/status", new { status = "Empty" });
        await client.PostAsJsonAsync("/api/cylinders/4/status", new { status = "Filled" });

        var exceeds120 = new string('B', 121);
        var badResponse = await client.PostAsJsonAsync("/api/cylinders/4/status", new { status = "Delivered", customerName = exceeds120 });
        Assert.Equal(HttpStatusCode.BadRequest, badResponse.StatusCode);
    }

    [Fact]
    public async Task ChangeStatus_ReturnsNotFound_ForMissingCylinder()
    {
        await _factory.SeedAsync();
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/cylinders/12345/status", new { status = "Empty" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
