using Samator.CylinderTracker.Api.Dtos;

namespace Samator.CylinderTracker.Api.Services;

public interface ICylinderService
{
    Task<PagedResult<CylinderResponse>> ListAsync(string? search, string? status, int page, int pageSize, CancellationToken ct);
    Task<CylinderResponse?> GetByIdAsync(int id, CancellationToken ct);
    Task<CylinderResponse> CreateAsync(CreateCylinderRequest request, CancellationToken ct);
    Task<CylinderResponse> UpdateAsync(int id, UpdateCylinderRequest request, CancellationToken ct);
    Task<CylinderResponse> ChangeStatusAsync(int id, ChangeStatusRequest request, CancellationToken ct);
}
