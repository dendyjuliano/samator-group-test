namespace Samator.CylinderTracker.Api.Domain;

public static class GasTypes
{
    public const string Oxygen = "Oxygen";
    public const string Nitrogen = "Nitrogen";
    public const string Argon = "Argon";
    public const string CarbonDioxide = "Carbon Dioxide";
    public const string Acetylene = "Acetylene";
    public const string Hydrogen = "Hydrogen";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Oxygen, Nitrogen, Argon, CarbonDioxide, Acetylene, Hydrogen
    };

    public static bool IsValid(string gasType) => All.Contains(gasType);
}
