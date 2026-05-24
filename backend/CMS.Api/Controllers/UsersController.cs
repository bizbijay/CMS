using System.Security.Claims;
using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    // GET: api/users
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListItemDto>>> GetAll()
    {
        var users = await _db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserListItemDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                LastLoginAt = u.LastLoginAt
            })
            .ToListAsync();

        return Ok(users);
    }

    // GET: api/users/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserListItemDto>> GetById(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        return Ok(ToListDto(user));
    }

    // POST: api/users
    [HttpPost]
    public async Task<ActionResult<UserListItemDto>> Create([FromBody] CreateUserRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var pwErrors = PasswordPolicy.Validate(request.Password);
        if (pwErrors.Count > 0)
            return BadRequest(new { message = PasswordPolicy.BuildErrorMessage(pwErrors) });

        var username = request.Username.Trim();
        var email = request.Email.Trim().ToLowerInvariant();

        var exists = await _db.Users
            .AnyAsync(u => u.Username == username || u.Email == email);

        if (exists)
            return Conflict(new { message = "A user with that username or email already exists." });

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName?.Trim(),
            LastName = request.LastName?.Trim(),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, ToListDto(user));
    }

    // PUT: api/users/5
    [HttpPut("{id:int}")]
    public async Task<ActionResult<UserListItemDto>> Update(int id, [FromBody] UpdateUserRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        var username = request.Username.Trim();
        var email = request.Email.Trim().ToLowerInvariant();

        // Check for collisions on username/email with *other* users.
        var conflict = await _db.Users
            .AnyAsync(u => u.Id != id && (u.Username == username || u.Email == email));

        if (conflict)
            return Conflict(new { message = "Another user already has that username or email." });

        user.Username = username;
        user.Email = email;
        user.FirstName = request.FirstName?.Trim();
        user.LastName = request.LastName?.Trim();
        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            var pwErrors = PasswordPolicy.Validate(request.Password);
            if (pwErrors.Count > 0)
                return BadRequest(new { message = PasswordPolicy.BuildErrorMessage(pwErrors) });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        await _db.SaveChangesAsync();

        return Ok(ToListDto(user));
    }

    // DELETE: api/users/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        // Refuse to let a user delete their own account through this endpoint.
        var currentIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(currentIdClaim, out var currentId) && currentId == id)
            return BadRequest(new { message = "You cannot delete your own account." });

        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static UserListItemDto ToListDto(User u) => new()
    {
        Id = u.Id,
        Username = u.Username,
        Email = u.Email,
        FirstName = u.FirstName,
        LastName = u.LastName,
        IsActive = u.IsActive,
        CreatedAt = u.CreatedAt,
        LastLoginAt = u.LastLoginAt
    };
}
