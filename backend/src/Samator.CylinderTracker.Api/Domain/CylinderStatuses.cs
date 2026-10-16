namespace Samator.CylinderTracker.Api.Domain;

public static class CylinderStatuses
{
    public const string Empty = "Empty";
    public const string Filled = "Filled";
    public const string Delivered = "Delivered";
    public const string InMaintenance = "InMaintenance";
    public const string Retired = "Retired";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Empty, Filled, Delivered, InMaintenance, Retired
    };

    private static readonly IReadOnlyDictionary<string, IReadOnlySet<string>> AllowedTransitions =
        new Dictionary<string, IReadOnlySet<string>>(StringComparer.Ordinal)
        {
            [Empty] = new HashSet<string> { Filled, InMaintenance, Retired },
            [Filled] = new HashSet<string> { Delivered, InMaintenance, Retired },
            [Delivered] = new HashSet<string> { Empty },
            [InMaintenance] = new HashSet<string> { Empty, Retired },
            [Retired] = new HashSet<string>(),
        };

    public static bool IsValid(string status) => All.Contains(status);

    public static bool CanTransition(string from, string to)
    {
        return AllowedTransitions.TryGetValue(from, out var next) && next.Contains(to);
    }

    public static IReadOnlySet<string> NextStatuses(string from)
    {
        return AllowedTransitions.TryGetValue(from, out var next) ? next : new HashSet<string>();
    }
}
