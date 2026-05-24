using System.Text;
using CMS.Api.Data;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Render and most PaaS hosts inject the port to bind on as the PORT env var.
// ASP.NET Core only reads ASPNETCORE_URLS, so translate here. Locally PORT
// is unset and we fall back to launchSettings.json.
var renderPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(renderPort))
{
    builder.WebHost.UseUrls($"http://+:{renderPort}");
}

// -----------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"] ?? throw new InvalidOperationException("Jwt:Key is missing in configuration.");
var jwtIssuer = jwtSection["Issuer"];
var jwtAudience = jwtSection["Audience"];

// CORS origins can be supplied two ways:
//   1) JSON array under "Cors:AllowedOrigins"  (works well in appsettings.json)
//   2) Comma-separated string under "Cors:AllowedOrigins"
//      (works well as a single env var on App Service / Vercel / etc.)
string[] allowedOrigins;
var corsArray = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
if (corsArray is { Length: > 0 })
{
    allowedOrigins = corsArray;
}
else
{
    var corsRaw = builder.Configuration["Cors:AllowedOrigins"];
    allowedOrigins = !string.IsNullOrWhiteSpace(corsRaw)
        ? corsRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        : new[] { "http://localhost:5173" };
}

// -----------------------------------------------------------------
// Services
// -----------------------------------------------------------------
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "CMS API", Version = "v1" });

    var jwtScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "JWT Bearer token. Example: \"Bearer {token}\"",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference { Id = "Bearer", Type = ReferenceType.SecurityScheme }
    };
    c.AddSecurityDefinition(jwtScheme.Reference.Id, jwtScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { jwtScheme, Array.Empty<string>() } });
});

// -----------------------------------------------------------------
// Pipeline
// -----------------------------------------------------------------
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Only enforce HTTPS in non-development environments. In development
    // the Vite dev server proxies /api over plain HTTP to port 5080, and
    // an HTTPS redirect would strip the Authorization header on the
    // cross-origin hop, producing spurious 401s.
    app.UseHttpsRedirection();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/", () => Results.Ok(new { service = "CMS.Api", status = "running" }));

app.Run();
