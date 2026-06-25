using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/maintenance-parts")]
public class MaintenancePartsController : ControllerBase
{
    private readonly IMaintenancePartService _service;

    public MaintenancePartsController(IMaintenancePartService service)
    {
        _service = service;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<MaintenancePartListItemDto>>> GetAll() =>
        Ok(await _service.GetAllAsync());

    [HttpPost]
    [Authorize(Policy = "maintenance_parts.add")]
    public async Task<ActionResult<MaintenancePartListItemDto>> Create([FromBody] CreateMaintenancePartRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var part = await _service.CreateAsync(request, CurrentUserId);
        return Ok(part);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "maintenance_parts.edit")]
    public async Task<ActionResult<MaintenancePartListItemDto>> Update(int id, [FromBody] UpdateMaintenancePartRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (part, error) = await _service.UpdateAsync(id, request, CurrentUserId);
        if (part is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });
        return Ok(part);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "maintenance_parts.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound();
    }
}
