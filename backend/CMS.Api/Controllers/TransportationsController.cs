using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransportationsController : ControllerBase
{
    private readonly ITransportationService _service;
    public TransportationsController(ITransportationService service) => _service = service;

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    [Authorize(Policy = "transportation.view")]
    public async Task<ActionResult<IEnumerable<TransportationListItemDto>>> GetAll([FromQuery] int? projectId = null)
    {
        if (projectId.HasValue)
            return Ok(await _service.GetByProjectAsync(projectId.Value));
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("report")]
    [Authorize(Policy = "transportation_report.view")]
    public async Task<ActionResult<IEnumerable<TransportationListItemDto>>> GetReport(
        [FromQuery] string? fromDate,
        [FromQuery] string? toDate,
        [FromQuery] string? transportedByName,
        [FromQuery] string? vehicleName,
        [FromQuery] string? materialName,
        [FromQuery] string? vendorName,
        [FromQuery] string? projectName,
        [FromQuery] string? partyName) =>
        Ok(await _service.GetReportAsync(fromDate, toDate, transportedByName, vehicleName, materialName, vendorName, projectName, partyName));

    [HttpGet("{id:int}")]
    [Authorize(Policy = "transportation.view")]
    public async Task<ActionResult<TransportationListItemDto>> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = "transportation.add")]
    public async Task<ActionResult<TransportationListItemDto>> Create([FromBody] CreateTransportationRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (item, error) = await _service.CreateAsync(request, CurrentUserId);
        if (error is not null) return Conflict(new { message = error });
        return CreatedAtAction(nameof(GetById), new { id = item!.Id }, item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "transportation.edit")]
    public async Task<ActionResult<TransportationListItemDto>> Update(int id, [FromBody] UpdateTransportationRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (item, error) = await _service.UpdateAsync(id, request, CurrentUserId);
        if (item is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });
        return Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "transportation.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound();
    }
}
