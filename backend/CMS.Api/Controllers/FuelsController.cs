using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FuelsController : ControllerBase
{
    private readonly IFuelService _fuels;
    public FuelsController(IFuelService fuels) => _fuels = fuels;

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<FuelListItemDto>>> GetAll() =>
        Ok(await _fuels.GetAllAsync());

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<ActionResult<FuelListItemDto>> GetById(int id)
    {
        var fuel = await _fuels.GetByIdAsync(id);
        return fuel is null ? NotFound() : Ok(fuel);
    }

    [HttpPost]
    [Authorize(Policy = "fuel_types.add")]
    public async Task<ActionResult<FuelListItemDto>> Create([FromBody] CreateFuelRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var fuel = await _fuels.CreateAsync(request, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = fuel.Id }, fuel);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "fuel_types.edit")]
    public async Task<ActionResult<FuelListItemDto>> Update(int id, [FromBody] UpdateFuelRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (fuel, error) = await _fuels.UpdateAsync(id, request, CurrentUserId);
        if (fuel is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });
        return Ok(fuel);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "fuel_types.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _fuels.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound();
    }
}
