namespace Samator.CylinderTracker.Api.Services;

public class CylinderValidationException : Exception
{
    public IDictionary<string, string[]> Errors { get; }

    public CylinderValidationException(IDictionary<string, string[]> errors)
        : base("Validation failed.")
    {
        Errors = errors;
    }

    public CylinderValidationException(string field, string message)
        : this(new Dictionary<string, string[]> { [field] = new[] { message } })
    {
    }
}

public class CylinderNotFoundException : Exception
{
}

public class CylinderConflictException : Exception
{
    public CylinderConflictException(string message) : base(message)
    {
    }
}
