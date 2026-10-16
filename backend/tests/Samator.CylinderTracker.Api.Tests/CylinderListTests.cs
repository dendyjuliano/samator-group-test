using System.Net;
using System.Net.Http.Json;
using Samator.CylinderTracker.Api.Dtos;
using Samator.CylinderTracker.Api.Entities;

namespace Samator.CylinderTracker.Api.Tests;

public class CylinderListTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CylinderListTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static Cylinder Build(int id, string serial, string status, string? customer, DateTime lastUpdated, string gasType = "Oxygen") =>
        new()
        {
            Id = id,
            SerialNumber = serial,
            GasType = gasType,
            Status = status,
            CustomerName = customer,
            LastUpdated = lastUpdated,
        };

    [Fact]
    public async Task Search_IsCaseInsensitive_AndMatchesUnicodeCustomerNames()
    {
        await _factory.SeedAsync(
            Build(1, "CYL-100001", "Delivered", "PT Sumber Gas Östara", new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)),
            Build(2, "CYL-100002", "Empty", null, new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc))
        );

        var client = _factory.CreateClient();
        var result = await client.GetFromJsonAsync<PagedResult<CylinderResponse>>("/api/cylinders?search=östara", TestJson.Options);

        Assert.NotNull(result);
        Assert.Single(result!.Items);
        Assert.Equal("CYL-100001", result.Items[0].SerialNumber);
    }

    [Fact]
    public async Task List_FiltersByStatus_AndSortsByLastUpdatedDescendingThenId()
    {
        await _factory.SeedAsync(
            Build(10, "CYL-200001", "Filled", null, new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)),
            Build(11, "CYL-200002", "Empty", null, new DateTime(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc)),
            Build(12, "CYL-200003", "Filled", null, new DateTime(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc)),
            Build(13, "CYL-200004", "Filled", null, new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc))
        );

        var client = _factory.CreateClient();
        var result = await client.GetFromJsonAsync<PagedResult<CylinderResponse>>("/api/cylinders?status=Filled&pageSize=50", TestJson.Options);

        Assert.NotNull(result);
        Assert.Equal(3, result!.TotalCount);
        Assert.Equal(new[] { "CYL-200003", "CYL-200004", "CYL-200001" }, result.Items.Select(i => i.SerialNumber));
    }

    [Fact]
    public async Task List_Paginates_AndReturnsEmptyItemsPastTheEnd()
    {
        var cylinders = Enumerable.Range(1, 15)
            .Select(i => Build(i, $"CYL-30{i:0000}", "Empty", null, new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddMinutes(i)))
            .ToArray();
        await _factory.SeedAsync(cylinders);

        var client = _factory.CreateClient();

        var page1 = await client.GetFromJsonAsync<PagedResult<CylinderResponse>>("/api/cylinders?pageSize=10&page=1", TestJson.Options);
        Assert.Equal(10, page1!.Items.Count);
        Assert.Equal(15, page1.TotalCount);

        var page2 = await client.GetFromJsonAsync<PagedResult<CylinderResponse>>("/api/cylinders?pageSize=10&page=2", TestJson.Options);
        Assert.Equal(5, page2!.Items.Count);

        var pastEnd = await client.GetFromJsonAsync<PagedResult<CylinderResponse>>("/api/cylinders?pageSize=10&page=99", TestJson.Options);
        Assert.Empty(pastEnd!.Items);
    }

    [Theory]
    [InlineData("/api/cylinders?page=0")]
    [InlineData("/api/cylinders?pageSize=51")]
    [InlineData("/api/cylinders?status=NotARealStatus")]
    public async Task List_ReturnsBadRequest_ForInvalidQueryParameters(string url)
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync(url);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
