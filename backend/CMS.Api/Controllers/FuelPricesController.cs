using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/fuel-prices")]
public class FuelPricesController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _cache;

    public FuelPricesController(IHttpClientFactory httpClientFactory, IMemoryCache cache)
    {
        _httpClientFactory = httpClientFactory;
        _cache = cache;
    }

    [HttpGet("current")]
    [Authorize]
    public async Task<IActionResult> GetCurrentPrice([FromQuery] string fuelType = "diesel")
    {
        var normalized = fuelType.Trim().ToLowerInvariant();

        if (normalized != "diesel" && normalized != "petrol")
            return BadRequest(new { message = "Supported fuel types: diesel, petrol." });

        var cacheKey = $"noc_{normalized}_price";

        if (_cache.TryGetValue(cacheKey, out decimal cached))
            return Ok(new { price = cached });

        try
        {
            var client = _httpClientFactory.CreateClient("noc");
            var html = await client.GetStringAsync("https://noc.org.np/");

            var label = normalized == "diesel" ? "[Dd]iesel" : "[Pp]etrol";

            var match = Regex.Match(
                html,
                $@"{label}\D{{0,200}}?(\d{{2,3}}(?:\.\d+)?)",
                RegexOptions.Singleline);

            if (!match.Success)
            {
                match = Regex.Match(
                    html,
                    $@"(?i){normalized}[^<]{{0,300}}?(\d{{2,3}}(?:\.\d+)?)",
                    RegexOptions.Singleline);
            }

            if (match.Success &&
                decimal.TryParse(match.Groups[1].Value, out var price) &&
                price >= 50 && price <= 300)
            {
                _cache.Set(cacheKey, price, TimeSpan.FromHours(1));
                return Ok(new { price });
            }

            return StatusCode(503, new { message = $"Could not parse {normalized} price from NOC website." });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { message = $"Failed to reach NOC website: {ex.Message}" });
        }
    }
}
