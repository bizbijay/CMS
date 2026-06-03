using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roles;
    public RolesController(IRoleService roles) => _roles = roles;

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    [Authorize(Policy = "roles.view")]
    public async Task<ActionResult<IEnumerable<RoleListItemDto>>> GetAll() =>
        Ok(await _roles.GetAllAsync());

    [HttpGet("{id:int}")]
    [Authorize(Policy = "roles.view")]
    public async Task<ActionResult<RoleListItemDto>> GetById(int id)
    {
        var role = await _roles.GetByIdAsync(id);
        return role is null ? NotFound() : Ok(role);
    }

    [HttpPost]
    [Authorize(Policy = "roles.add")]
    public async Task<ActionResult<RoleListItemDto>> Create([FromBody] CreateRoleRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var role = await _roles.CreateAsync(request, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = role.Id }, role);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "roles.edit")]
    public async Task<ActionResult<RoleListItemDto>> Update(int id, [FromBody] UpdateRoleRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (role, error) = await _roles.UpdateAsync(id, request, CurrentUserId);
        if (role is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });
        return Ok(role);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "roles.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _roles.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
