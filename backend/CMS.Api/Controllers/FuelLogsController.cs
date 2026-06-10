using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FuelLogsController : ControllerBase
{
    private readonly IFuelLogService _service;
    public FuelLogsController(IFuelLogService service) => _service = service;

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    [Authorize(Policy = "fuel_log.view")]
    public async Task<ActionResult<IEnumerable<FuelLogListItemDto>>> GetAll() =>
        Ok(await _service.GetAllAsync());

    [HttpGet("{id:int}")]
    [Authorize(Policy = "fuel_log.view")]
    public async Task<ActionResult<FuelLogListItemDto>> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = "fuel_log.add")]
    public async Task<ActionResult<FuelLogListItemDto>> Create([FromBody] CreateFuelLogRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (item, error) = await _service.CreateAsync(request, CurrentUserId);
        if (error is not null) return Conflict(new { message = error });
        return CreatedAtAction(nameof(GetById), new { id = item!.Id }, item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "fuel_log.edit")]
    public async Task<ActionResult<FuelLogListItemDto>> Update(int id, [FromBody] UpdateFuelLogRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (item, error) = await _service.UpdateAsync(id, request, CurrentUserId);
        if (item is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });
        return Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "fuel_log.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound();
    }
}
