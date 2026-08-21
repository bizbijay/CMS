using CMS.Api.Data;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class UserColumnPreferenceService : IUserColumnPreferenceService
{
    private readonly AppDbContext _context;

    public UserColumnPreferenceService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<string?> GetPreferenceAsync(int userId, string tableKey)
    {
        var pref = await _context.UserColumnPreferences
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId && p.TableKey == tableKey);

        return pref?.ColumnsJson;
    }

    public async Task SavePreferenceAsync(int userId, string tableKey, string columnsJson)
    {
        var pref = await _context.UserColumnPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId && p.TableKey == tableKey);

        if (pref == null)
        {
            pref = new UserColumnPreference
            {
                UserId = userId,
                TableKey = tableKey,
                ColumnsJson = columnsJson,
                UpdatedAt = DateTime.UtcNow
            };
            _context.UserColumnPreferences.Add(pref);
        }
        else
        {
            pref.ColumnsJson = columnsJson;
            pref.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}
