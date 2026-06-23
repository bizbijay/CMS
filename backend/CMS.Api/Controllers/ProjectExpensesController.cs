using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/project-expenses")]
public class ProjectExpensesController : ControllerBase
{
    private readonly IProjectExpenseService _service;
    public ProjectExpensesController(IProjectExpenseService service) => _service = service;

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    [Authorize(Policy = "project_expenses.view")]
    public async Task<ActionResult<IEnumerable<ProjectExpenseListItemDto>>> GetByProject([FromQuery] int projectId) =>
        Ok(await _service.GetByProjectAsync(projectId));

    [HttpGet("{id:int}")]
    [Authorize(Policy = "project_expenses.view")]
    public async Task<ActionResult<ProjectExpenseListItemDto>> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = "project_expenses.add")]
    public async Task<ActionResult<ProjectExpenseListItemDto>> Create([FromBody] CreateProjectExpenseRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (item, error) = await _service.CreateAsync(request, CurrentUserId);
        if (error is not null) return Conflict(new { message = error });
        return CreatedAtAction(nameof(GetById), new { id = item!.Id }, item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "project_expenses.edit")]
    public async Task<ActionResult<ProjectExpenseListItemDto>> Update(int id, [FromBody] UpdateProjectExpenseRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (item, error) = await _service.UpdateAsync(id, request, CurrentUserId);
        if (item is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });
        return Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "project_expenses.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound();
    }
}
