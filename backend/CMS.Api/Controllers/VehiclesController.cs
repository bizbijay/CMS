using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleService _vehicles;

    public VehiclesController(IVehicleService vehicles)
    {
        _vehicles = vehicles;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    // GET: api/vehicles
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VehicleListItemDto>>> GetAll()
    {
        return Ok(await _vehicles.GetAllAsync());
    }

    // GET: api/vehicles/5
    [HttpGet("{id:int}")]
    [Authorize(Policy = "vehicles.view")]
    public async Task<ActionResult<VehicleListItemDto>> GetById(int id)
    {
        var vehicle = await _vehicles.GetByIdAsync(id);
        return vehicle is null ? NotFound() : Ok(vehicle);
    }

    // POST: api/vehicles
    [HttpPost]
    [Authorize(Policy = "vehicles.add")]
    public async Task<ActionResult<VehicleListItemDto>> Create([FromBody] CreateVehicleRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (vehicle, error) = await _vehicles.CreateAsync(request, CurrentUserId);
        if (error is not null) return Conflict(new { message = error });

        return CreatedAtAction(nameof(GetById), new { id = vehicle!.Id }, vehicle);
    }

    // PUT: api/vehicles/5
    [HttpPut("{id:int}")]
    [Authorize(Policy = "vehicles.edit")]
    public async Task<ActionResult<VehicleListItemDto>> Update(int id, [FromBody] UpdateVehicleRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (vehicle, error) = await _vehicles.UpdateAsync(id, request, CurrentUserId);
        if (vehicle is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });

        return Ok(vehicle);
    }

    // DELETE: api/vehicles/5
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "vehicles.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _vehicles.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound();
    }
}
