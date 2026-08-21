namespace CMS.Api.Services;

public interface IUserColumnPreferenceService
{
    Task<string?> GetPreferenceAsync(int userId, string tableKey);
    Task SavePreferenceAsync(int userId, string tableKey, string columnsJson);
}
