using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Samator.CylinderTracker.Api.Data;
using Samator.CylinderTracker.Api.Domain;
using Samator.CylinderTracker.Api.Dtos;
using Samator.CylinderTracker.Api.Entities;

namespace Samator.CylinderTracker.Api.Services;

public partial class CylinderService : ICylinderService
{
    private const int MaxPageSize = 50;
    private const int CustomerNameMaxLength = 120;

    [GeneratedRegex(@"^CYL-\d{6}$")]
    private static partial Regex SerialNumberPattern();

    private readonly AppDbContext _db;

    public CylinderService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<CylinderResponse>> ListAsync(string? search, string? status, int page, int pageSize, CancellationToken ct)
    {
        var errors = new Dictionary<string, string[]>();

        if (page < 1)
        {
            errors["page"] = new[] { "page must be 1 or greater." };
        }

        if (pageSize < 1 || pageSize > MaxPageSize)
        {
            errors["pageSize"] = new[] { $"pageSize must be between 1 and {MaxPageSize}." };
        }

        if (!string.IsNullOrWhiteSpace(status) && !CylinderStatuses.IsValid(status))
        {
            errors["status"] = new[] { $"status must be one of: {string.Join(", ", CylinderStatuses.All)}." };
        }

        if (errors.Count > 0)
        {
            throw new CylinderValidationException(errors);
        }

        var query = _db.Cylinders.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(c => c.Status == status);
        }

        // Materialize after the DB-level status filter, then apply a culture-aware
        // case-insensitive search in-memory. SQLite's default LIKE/NOCASE only folds
        // ASCII a-z, which would miss matches against the unicode customer names in
        // the seed data (e.g. "Östara", "Ünggul").
        var candidates = await query.ToListAsync(ct);

        if (!string.IsNullOrWhiteSpace(search))
        {
            candidates = candidates
                .Where(c =>
                    c.SerialNumber.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    (c.CustomerName != null && c.CustomerName.Contains(search, StringComparison.OrdinalIgnoreCase)))
                .ToList();
        }

        var ordered = candidates
            .OrderByDescending(c => c.LastUpdated)
            .ThenBy(c => c.Id)
            .ToList();

        var totalCount = ordered.Count;
        var items = ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToResponse)
            .ToList();

        return new PagedResult<CylinderResponse>(items, page, pageSize, totalCount);
    }

    public async Task<CylinderResponse?> GetByIdAsync(int id, CancellationToken ct)
    {
        var cylinder = await _db.Cylinders.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
        return cylinder is null ? null : ToResponse(cylinder);
    }

    public async Task<CylinderResponse> CreateAsync(CreateCylinderRequest request, CancellationToken ct)
    {
        var serialNumber = ValidateSerialAndGasType(request.SerialNumber, request.GasType);
        await EnsureSerialNotTakenAsync(serialNumber, excludeId: null, ct);

        var cylinder = new Cylinder
        {
            SerialNumber = serialNumber,
            GasType = request.GasType,
            Status = CylinderStatuses.Empty,
            CustomerName = null,
            LastUpdated = DateTime.UtcNow,
        };

        _db.Cylinders.Add(cylinder);
        await _db.SaveChangesAsync(ct);

        return ToResponse(cylinder);
    }

    public async Task<CylinderResponse> UpdateAsync(int id, UpdateCylinderRequest request, CancellationToken ct)
    {
        var cylinder = await _db.Cylinders.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new CylinderNotFoundException();

        var serialNumber = ValidateSerialAndGasType(request.SerialNumber, request.GasType);
        await EnsureSerialNotTakenAsync(serialNumber, excludeId: id, ct);

        cylinder.SerialNumber = serialNumber;
        cylinder.GasType = request.GasType;
        cylinder.LastUpdated = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return ToResponse(cylinder);
    }

    public async Task<CylinderResponse> ChangeStatusAsync(int id, ChangeStatusRequest request, CancellationToken ct)
    {
        var cylinder = await _db.Cylinders.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new CylinderNotFoundException();

        if (string.IsNullOrWhiteSpace(request.Status) || !CylinderStatuses.IsValid(request.Status))
        {
            throw new CylinderValidationException("status", $"status must be one of: {string.Join(", ", CylinderStatuses.All)}.");
        }

        if (!CylinderStatuses.CanTransition(cylinder.Status, request.Status))
        {
            throw new CylinderValidationException("status", $"Cannot transition from {cylinder.Status} to {request.Status}.");
        }

        if (request.Status == CylinderStatuses.Delivered)
        {
            if (string.IsNullOrWhiteSpace(request.CustomerName))
            {
                throw new CylinderValidationException("customerName", "customerName is required when status is Delivered.");
            }

            if (request.CustomerName.Length > CustomerNameMaxLength)
            {
                throw new CylinderValidationException("customerName", $"customerName must be at most {CustomerNameMaxLength} characters.");
            }

            cylinder.CustomerName = request.CustomerName.Trim();
        }
        else
        {
            cylinder.CustomerName = null;
        }

        cylinder.Status = request.Status;
        cylinder.LastUpdated = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return ToResponse(cylinder);
    }

    private string ValidateSerialAndGasType(string serialNumber, string gasType)
    {
        var errors = new Dictionary<string, string[]>();

        var normalizedSerial = (serialNumber ?? string.Empty).Trim().ToUpperInvariant();
        if (!SerialNumberPattern().IsMatch(normalizedSerial))
        {
            errors["serialNumber"] = new[] { "serialNumber must match the format CYL-XXXXXX (6 digits)." };
        }

        if (string.IsNullOrWhiteSpace(gasType) || !GasTypes.IsValid(gasType))
        {
            errors["gasType"] = new[] { $"gasType must be one of: {string.Join(", ", GasTypes.All)}." };
        }

        if (errors.Count > 0)
        {
            throw new CylinderValidationException(errors);
        }

        return normalizedSerial;
    }

    private async Task EnsureSerialNotTakenAsync(string normalizedSerial, int? excludeId, CancellationToken ct)
    {
        var query = _db.Cylinders.Where(c => c.SerialNumber == normalizedSerial);
        if (excludeId.HasValue)
        {
            query = query.Where(c => c.Id != excludeId.Value);
        }

        if (await query.AnyAsync(ct))
        {
            throw new CylinderConflictException($"serialNumber '{normalizedSerial}' is already in use.");
        }
    }

    private static CylinderResponse ToResponse(Cylinder c) =>
        new(c.Id, c.SerialNumber, c.GasType, c.Status, c.CustomerName, c.LastUpdated);
}
