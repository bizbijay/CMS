using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/role-permissions")]
public class RolePermissionsController : ControllerBase
{
    private readonly IRolePermissionService _service;
    public RolePermissionsController(IRolePermissionService service) => _service = service;

    [HttpGet("{roleId:int}")]
    [Authorize(Policy = "role_permissions.view")]
    public async Task<ActionResult<RolePermissionsDto>> GetByRole(int roleId)
    {
        var result = await _service.GetByRoleIdAsync(roleId);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPut("{roleId:int}")]
    [Authorize(Policy = "role_permissions.edit")]
    public async Task<ActionResult<RolePermissionsDto>> Set(int roleId, [FromBody] SetRolePermissionsRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (result, error) = await _service.SetAsync(roleId, request);
        if (result is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });
        return Ok(result);
    }
}
