using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/project-wages")]
public class ProjectWagesController : ControllerBase
{
    private readonly IProjectWageService _service;
    public ProjectWagesController(IProjectWageService service) => _service = service;

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    [Authorize(Policy = "project_wages.view")]
    public async Task<ActionResult<IEnumerable<ProjectWageListItemDto>>> GetByProject([FromQuery] int projectId) =>
        Ok(await _service.GetByProjectAsync(projectId));

    [HttpGet("{id:int}")]
    [Authorize(Policy = "project_wages.view")]
    public async Task<ActionResult<ProjectWageListItemDto>> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = "project_wages.add")]
    public async Task<ActionResult<ProjectWageListItemDto>> Create([FromBody] CreateProjectWageRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (item, error) = await _service.CreateAsync(request, CurrentUserId);
        if (error is not null) return Conflict(new { message = error });
        return CreatedAtAction(nameof(GetById), new { id = item!.Id }, item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "project_wages.edit")]
    public async Task<ActionResult<ProjectWageListItemDto>> Update(int id, [FromBody] UpdateProjectWageRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (item, error) = await _service.UpdateAsync(id, request, CurrentUserId);
        if (item is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });
        return Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "project_wages.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound();
    }
}
