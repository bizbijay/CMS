using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CMS.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace CMS.Api.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config)
    {
        _config = config;
    }

    public (string Token, DateTime ExpiresAt) CreateToken(User user)
    {
        var jwtSection = _config.GetSection("Jwt");
        var key = jwtSection["Key"] ?? throw new InvalidOperationException("JWT key is not configured.");
        var issuer = jwtSection["Issuer"];
        var audience = jwtSection["Audience"];
        var minutes = int.TryParse(jwtSection["ExpiresInMinutes"], out var m) ? m : 1;

        var expiresAt = DateTime.UtcNow.AddMinutes(minutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,  user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti,  Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier,    user.Id.ToString()),
            new(ClaimTypes.Name,              user.Username),
            new(ClaimTypes.Email,             user.Email)
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var jwt = new JwtSecurityToken(
            issuer:    issuer,
            audience:  audience,
            claims:    claims,
            notBefore: DateTime.UtcNow,
            expires:   expiresAt,
            signingCredentials: creds);

        var token = new JwtSecurityTokenHandler().WriteToken(jwt);
        return (token, expiresAt);
    }
}
