namespace Samator.CylinderTracker.Api.Entities;

public class Cylinder
{
    public int Id { get; set; }
    public required string SerialNumber { get; set; }
    public required string GasType { get; set; }
    public required string Status { get; set; }
    public string? CustomerName { get; set; }
    public DateTime LastUpdated { get; set; }
}
