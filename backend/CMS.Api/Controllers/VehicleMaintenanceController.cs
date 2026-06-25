using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CMS.Api.Controllers;

// ── Logs ─────────────────────────────────────────────────────────────────────

[ApiController]
[Route("api/vehicle-maintenance-logs")]
[Authorize]
public class VehicleMaintenanceLogsController : ControllerBase
{
    private readonly IVehicleMaintenanceLogService _service;
    public VehicleMaintenanceLogsController(IVehicleMaintenanceLogService service) => _service = service;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [Authorize(Policy = "vehicle_maintenance.view")]
    public async Task<IActionResult> List([FromQuery] int vehicleId)
    {
        var items = await _service.GetByVehicleAsync(vehicleId);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = "vehicle_maintenance.view")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = "vehicle_maintenance.add")]
    public async Task<IActionResult> Create([FromBody] CreateVehicleMaintenanceLogRequest request)
    {
        var (item, error) = await _service.CreateAsync(request, UserId);
        if (error is not null) return BadRequest(new { message = error });
        return CreatedAtAction(nameof(GetById), new { id = item!.Id }, item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "vehicle_maintenance.edit")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateVehicleMaintenanceLogRequest request)
    {
        var (item, error) = await _service.UpdateAsync(id, request, UserId);
        if (error is not null) return BadRequest(new { message = error });
        return item is null ? NotFound() : Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "vehicle_maintenance.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, UserId);
        return deleted ? NoContent() : NotFound();
    }
}

// ── Parts ─────────────────────────────────────────────────────────────────────

[ApiController]
[Route("api/vehicle-maintenance-parts")]
[Authorize]
public class VehicleMaintenancePartsController : ControllerBase
{
    private readonly IVehicleMaintenancePartService _service;
    public VehicleMaintenancePartsController(IVehicleMaintenancePartService service) => _service = service;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [Authorize(Policy = "vehicle_maintenance.view")]
    public async Task<IActionResult> List([FromQuery] int logId)
    {
        var items = await _service.GetByLogAsync(logId);
        return Ok(items);
    }

    [HttpPost]
    [Authorize(Policy = "vehicle_maintenance.add")]
    public async Task<IActionResult> Create([FromBody] CreateVehicleMaintenancePartRequest request)
    {
        var (item, error) = await _service.CreateAsync(request, UserId);
        if (error is not null) return BadRequest(new { message = error });
        return Ok(item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "vehicle_maintenance.edit")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateVehicleMaintenancePartRequest request)
    {
        var (item, error) = await _service.UpdateAsync(id, request, UserId);
        if (error is not null) return BadRequest(new { message = error });
        return item is null ? NotFound() : Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "vehicle_maintenance.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, UserId);
        return deleted ? NoContent() : NotFound();
    }
}

// ── Wages ─────────────────────────────────────────────────────────────────────

[ApiController]
[Route("api/vehicle-maintenance-wages")]
[Authorize]
public class VehicleMaintenanceWagesController : ControllerBase
{
    private readonly IVehicleMaintenanceWageService _service;
    public VehicleMaintenanceWagesController(IVehicleMaintenanceWageService service) => _service = service;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [Authorize(Policy = "vehicle_maintenance.view")]
    public async Task<IActionResult> List([FromQuery] int logId)
    {
        var items = await _service.GetByLogAsync(logId);
        return Ok(items);
    }

    [HttpPost]
    [Authorize(Policy = "vehicle_maintenance.add")]
    public async Task<IActionResult> Create([FromBody] CreateVehicleMaintenanceWageRequest request)
    {
        var (item, error) = await _service.CreateAsync(request, UserId);
        if (error is not null) return BadRequest(new { message = error });
        return Ok(item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "vehicle_maintenance.edit")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateVehicleMaintenanceWageRequest request)
    {
        var (item, error) = await _service.UpdateAsync(id, request, UserId);
        if (error is not null) return BadRequest(new { message = error });
        return item is null ? NotFound() : Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "vehicle_maintenance.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, UserId);
        return deleted ? NoContent() : NotFound();
    }
}
