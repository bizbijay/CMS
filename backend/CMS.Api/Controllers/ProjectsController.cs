using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projects;
    public ProjectsController(IProjectService projects) => _projects = projects;

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    [Authorize(Policy = "projects.view")]
    public async Task<ActionResult<IEnumerable<ProjectListItemDto>>> GetAll() =>
        Ok(await _projects.GetAllAsync());

    [HttpGet("{id:int}")]
    [Authorize(Policy = "projects.view")]
    public async Task<ActionResult<ProjectListItemDto>> GetById(int id)
    {
        var project = await _projects.GetByIdAsync(id);
        return project is null ? NotFound() : Ok(project);
    }

    [HttpPost]
    [Authorize(Policy = "projects.add")]
    public async Task<ActionResult<ProjectListItemDto>> Create([FromBody] CreateProjectRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var project = await _projects.CreateAsync(request, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = project.Id }, project);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "projects.edit")]
    public async Task<ActionResult<ProjectListItemDto>> Update(int id, [FromBody] UpdateProjectRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (project, error) = await _projects.UpdateAsync(id, request, CurrentUserId);
        if (project is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });
        return Ok(project);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "projects.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _projects.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
