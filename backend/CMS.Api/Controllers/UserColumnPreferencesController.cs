using System.Security.Claims;
using System.Text.Json;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/user-column-preferences")]
[Authorize]
public class UserColumnPreferencesController : ControllerBase
{
    private readonly IUserColumnPreferenceService _preferenceService;

    public UserColumnPreferencesController(IUserColumnPreferenceService preferenceService)
    {
        _preferenceService = preferenceService;
    }

    // GET: api/user-column-preferences/{tableKey}
    [HttpGet("{tableKey}")]
    public async Task<IActionResult> GetPreference(string tableKey)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var columnsJson = await _preferenceService.GetPreferenceAsync(userId.Value, tableKey);
        if (string.IsNullOrWhiteSpace(columnsJson))
        {
            return Ok(new Dictionary<string, bool>());
        }

        try
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, bool>>(columnsJson);
            return Ok(dict ?? new Dictionary<string, bool>());
        }
        catch
        {
            return Ok(new Dictionary<string, bool>());
        }
    }

    // PUT: api/user-column-preferences/{tableKey}
    [HttpPut("{tableKey}")]
    public async Task<IActionResult> SavePreference(string tableKey, [FromBody] Dictionary<string, bool> preferences)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var json = JsonSerializer.Serialize(preferences ?? new Dictionary<string, bool>());
        await _preferenceService.SavePreferenceAsync(userId.Value, tableKey, json);

        return Ok(new { message = "Preferences saved successfully." });
    }

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }
}
