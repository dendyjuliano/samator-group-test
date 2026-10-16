namespace Samator.CylinderTracker.Api.Dtos;

public record CylinderResponse(
    int Id,
    string SerialNumber,
    string GasType,
    string Status,
    string? CustomerName,
    DateTime LastUpdated);

public record CreateCylinderRequest(string SerialNumber, string GasType);

public record UpdateCylinderRequest(string SerialNumber, string GasType);

public record ChangeStatusRequest(string Status, string? CustomerName);

public record PagedResult<T>(List<T> Items, int Page, int PageSize, int TotalCount);
