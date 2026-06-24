using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/project-commissions")]
[Authorize]
public class ProjectCommissionsController : ControllerBase
{
    private readonly IProjectCommissionService _service;
    public ProjectCommissionsController(IProjectCommissionService service) => _service = service;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [Authorize(Policy = "project_commissions.view")]
    public async Task<IActionResult> List([FromQuery] int projectId)
    {
        var items = await _service.GetByProjectAsync(projectId);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = "project_commissions.view")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = "project_commissions.add")]
    public async Task<IActionResult> Create([FromBody] CreateProjectCommissionRequest request)
    {
        var (item, error) = await _service.CreateAsync(request, UserId);
        if (error is not null) return BadRequest(new { message = error });
        return CreatedAtAction(nameof(GetById), new { id = item!.Id }, item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "project_commissions.edit")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProjectCommissionRequest request)
    {
        var (item, error) = await _service.UpdateAsync(id, request, UserId);
        if (error is not null) return BadRequest(new { message = error });
        return item is null ? NotFound() : Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "project_commissions.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, UserId);
        return deleted ? NoContent() : NotFound();
    }
}
