using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _users;

    public UsersController(IUserService users)
    {
        _users = users;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    // GET: api/users/drivers  – all drivers (any vehicle type)
    [HttpGet("drivers")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<UserListItemDto>>> GetDrivers()
    {
        var all = await _users.GetAllAsync();
        return Ok(all.Where(u => u.RoleName != null &&
                                 u.RoleName.Equals("Driver", StringComparison.OrdinalIgnoreCase)));
    }

    // GET: api/users/dozer-drivers  – drivers assigned to a Dozer vehicle
    [HttpGet("dozer-drivers")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<UserListItemDto>>> GetDozerDrivers() =>
        Ok(await _users.GetDozerDriversAsync());

    // GET: api/users/profile – current logged-in user profile
    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<UserListItemDto>> GetProfile()
    {
        var user = await _users.GetByIdAsync(CurrentUserId);
        return user is null ? NotFound() : Ok(user);
    }

    // GET: api/users
    [HttpGet]
    [Authorize(Policy = "users.view")]
    public async Task<ActionResult<IEnumerable<UserListItemDto>>> GetAll()
    {
        return Ok(await _users.GetAllAsync());
    }

    // GET: api/users/5
    [HttpGet("{id:int}")]
    [Authorize(Policy = "users.view")]
    public async Task<ActionResult<UserListItemDto>> GetById(int id)
    {
        var user = await _users.GetByIdAsync(id);
        return user is null ? NotFound() : Ok(user);
    }

    // POST: api/users
    [HttpPost]
    [Authorize(Policy = "users.add")]
    public async Task<ActionResult<UserListItemDto>> Create([FromBody] CreateUserRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (user, error) = await _users.CreateAsync(request, CurrentUserId);
        if (error is not null)
        {
            var isConflict = error.Contains("already exists");
            return isConflict ? Conflict(new { message = error }) : BadRequest(new { message = error });
        }

        return CreatedAtAction(nameof(GetById), new { id = user!.Id }, user);
    }

    // PUT: api/users/5
    [HttpPut("{id:int}")]
    [Authorize(Policy = "users.edit")]
    public async Task<ActionResult<UserListItemDto>> Update(int id, [FromBody] UpdateUserRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (user, error) = await _users.UpdateAsync(id, request, CurrentUserId);
        if (user is null && error is null) return NotFound();
        if (error is not null)
        {
            var isConflict = error.Contains("already has");
            return isConflict ? Conflict(new { message = error }) : BadRequest(new { message = error });
        }

        return Ok(user);
    }

    // DELETE: api/users/5
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "users.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var (deleted, error) = await _users.DeleteAsync(id, CurrentUserId);
        if (error is not null) return BadRequest(new { message = error });
        return deleted ? NoContent() : NotFound();
    }
}
