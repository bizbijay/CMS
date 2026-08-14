using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DozerLogsController : ControllerBase
{
    private readonly IDozerLogService _service;
    public DozerLogsController(IDozerLogService service) => _service = service;

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    [Authorize(Policy = "dozer_log.view")]
    public async Task<ActionResult<IEnumerable<DozerLogListItemDto>>> GetAll() =>
        Ok(await _service.GetAllAsync());

    [HttpGet("report")]
    [Authorize(Policy = "dozer_log_report.view")]
    public async Task<ActionResult<IEnumerable<DozerLogListItemDto>>> GetReport(
        [FromQuery] string? fromDate,
        [FromQuery] string? toDate,
        [FromQuery] string? driverName,
        [FromQuery] string? vehicleName,
        [FromQuery] string? projectName,
        [FromQuery] string? partyName) =>
        Ok(await _service.GetReportAsync(fromDate, toDate, driverName, vehicleName, projectName, partyName));

    [HttpGet("{id:int}")]
    [Authorize(Policy = "dozer_log.view")]
    public async Task<ActionResult<DozerLogListItemDto>> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = "dozer_log.add")]
    public async Task<ActionResult<DozerLogListItemDto>> Create([FromBody] CreateDozerLogRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (item, error) = await _service.CreateAsync(request, CurrentUserId);
        if (error is not null) return Conflict(new { message = error });
        return CreatedAtAction(nameof(GetById), new { id = item!.Id }, item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "dozer_log.edit")]
    public async Task<ActionResult<DozerLogListItemDto>> Update(int id, [FromBody] UpdateDozerLogRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (item, error) = await _service.UpdateAsync(id, request, CurrentUserId);
        if (item is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });
        return Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "dozer_log.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound();
    }
}
