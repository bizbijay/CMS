namespace CMS.Api.Services;

/// <summary>
/// Centralized password rules. Mirrored on the frontend in
/// <c>frontend/src/services/passwordPolicy.ts</c>; keep them in sync.
/// </summary>
public static class PasswordPolicy
{
    public const int MinLength = 8;
    public const int MaxLength = 100;

    // Punctuation set treated as "special characters".
    private const string SpecialCharacters = "!@#$%^&*()_+-=[]{};:'\",.<>/?\\|`~";

    public static List<string> Validate(string password)
    {
        var errors = new List<string>();

        if (string.IsNullOrEmpty(password))
        {
            errors.Add("Password is required.");
            return errors;
        }

        if (password.Length < MinLength)
            errors.Add($"must be at least {MinLength} characters");

        if (password.Length > MaxLength)
            errors.Add($"must be no more than {MaxLength} characters");

        if (!password.Any(char.IsUpper))
            errors.Add("must contain an uppercase letter");

        if (!password.Any(char.IsLower))
            errors.Add("must contain a lowercase letter");

        if (!password.Any(char.IsDigit))
            errors.Add("must contain a digit");

        if (!password.Any(c => SpecialCharacters.Contains(c)))
            errors.Add("must contain a special character");

        return errors;
    }

    public static string BuildErrorMessage(IReadOnlyCollection<string> errors)
        => "Password does not meet requirements: " + string.Join(", ", errors) + ".";
}
