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

// CORS origins resolution. Two supported shapes:
//   1) Comma-separated string under "Cors:AllowedOrigins"
//      (typical for a single env var on Render / App Service / etc.)
//   2) JSON array under "Cors:AllowedOrigins"
//      (typical inside appsettings.json)
//
// Important: check the raw string FIRST. Env vars on PaaS hosts use shape (1),
// while appsettings.json uses shape (2). If you check the array first, the
// appsettings.json default ["http://localhost:5173"] silently wins over the
// production env var because they live under different config keys
// (`Cors:AllowedOrigins:0` for the array vs `Cors:AllowedOrigins` for the env var).
string[] allowedOrigins;
var corsRaw = builder.Configuration["Cors:AllowedOrigins"];
if (!string.IsNullOrWhiteSpace(corsRaw))
{
    allowedOrigins = corsRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}
else
{
    var corsArray = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
    allowedOrigins = corsArray is { Length: > 0 }
        ? corsArray
        : new[] { "http://localhost:5173" };
}

// -----------------------------------------------------------------
// Services
// -----------------------------------------------------------------
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<IMaterialService, MaterialService>();
builder.Services.AddScoped<IVendorService, VendorService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ITransportationService, TransportationService>();
builder.Services.AddScoped<IFuelService, FuelService>();
builder.Services.AddScoped<IFuelLogService, FuelLogService>();

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

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
        opts.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter(
                System.Text.Json.JsonNamingPolicy.CamelCase)));
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
