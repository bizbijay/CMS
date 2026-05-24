using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AppDbContext db, IJwtTokenService jwt, ILogger<AuthController> logger)
    {
        _db = db;
        _jwt = jwt;
        _logger = logger;
    }

    // POST: api/auth/register
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
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
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var (token, expiresAt) = _jwt.CreateToken(user);

        return Ok(new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = ToDto(user)
        });
    }

    // POST: api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var key = request.UsernameOrEmail.Trim();
        var keyLower = key.ToLowerInvariant();

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Username == key || u.Email == keyLower);

        if (user is null || !user.IsActive)
            return Unauthorized(new { message = "Invalid credentials." });

        var passwordOk = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!passwordOk)
            return Unauthorized(new { message = "Invalid credentials." });

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var (token, expiresAt) = _jwt.CreateToken(user);

        return Ok(new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = ToDto(user)
        });
    }

    // GET: api/auth/me  -> example protected endpoint
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var id))
            return Unauthorized();

        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        return Ok(ToDto(user));
    }

    // POST: api/auth/change-password
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var id))
            return Unauthorized();

        var user = await _db.Users.FindAsync(id);
        if (user is null || !user.IsActive)
            return Unauthorized();

        // Verify the current password matches what's on file.
        var currentOk = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash);
        if (!currentOk)
            return BadRequest(new { message = "Current password is incorrect." });

        var pwErrors = PasswordPolicy.Validate(request.NewPassword);
        if (pwErrors.Count > 0)
            return BadRequest(new { message = PasswordPolicy.BuildErrorMessage(pwErrors) });

        // Don't allow setting the same password again — minor UX guard.
        if (BCrypt.Net.BCrypt.Verify(request.NewPassword, user.PasswordHash))
            return BadRequest(new { message = "New password must be different from the current password." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static UserDto ToDto(User u) => new()
    {
        Id = u.Id,
        Username = u.Username,
        Email = u.Email,
        FirstName = u.FirstName,
        LastName = u.LastName
    };
}
