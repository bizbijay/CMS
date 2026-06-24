using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/government-offices")]
public class GovernmentOfficesController : ControllerBase
{
    private readonly IGovernmentOfficeService _service;

    public GovernmentOfficesController(IGovernmentOfficeService service)
    {
        _service = service;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<GovernmentOfficeListItemDto>>> GetAll() =>
        Ok(await _service.GetAllAsync());

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<ActionResult<GovernmentOfficeListItemDto>> GetById(int id)
    {
        var office = await _service.GetByIdAsync(id);
        return office is null ? NotFound() : Ok(office);
    }

    [HttpPost]
    [Authorize(Policy = "govt_offices.add")]
    public async Task<ActionResult<GovernmentOfficeListItemDto>> Create([FromBody] CreateGovernmentOfficeRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var office = await _service.CreateAsync(request, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = office.Id }, office);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "govt_offices.edit")]
    public async Task<ActionResult<GovernmentOfficeListItemDto>> Update(int id, [FromBody] UpdateGovernmentOfficeRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (office, error) = await _service.UpdateAsync(id, request, CurrentUserId);
        if (office is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });
        return Ok(office);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "govt_offices.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound();
    }
}
