using System.Text;
using CMS.Api.Authorization;
using CMS.Api.Data;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
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
builder.Services.AddScoped<IDozerLogService, DozerLogService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<IRolePermissionService, RolePermissionService>();
builder.Services.AddScoped<ISalarySetupService, SalarySetupService>();
builder.Services.AddScoped<IMonthlySalaryService, MonthlySalaryService>();
builder.Services.AddScoped<ISalaryPaymentService, SalaryPaymentService>();
builder.Services.AddScoped<ISalaryDetailService, SalaryDetailService>();
builder.Services.AddScoped<IProjectExpenseService, ProjectExpenseService>();
builder.Services.AddScoped<IProjectWageService, ProjectWageService>();
builder.Services.AddScoped<IGovernmentOfficeService, GovernmentOfficeService>();

builder.Services.AddMemoryCache();
builder.Services.AddHttpClient("noc", c =>
{
    c.Timeout = TimeSpan.FromSeconds(10);
    c.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (compatible; CMS/1.0)");
});
builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();

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

builder.Services.AddAuthorization(options =>
{
    string[] permissions =
    [
        "dashboard.view",

        "users.view",    "users.add",    "users.edit",    "users.delete",

        "transportation.view", "transportation.add", "transportation.edit", "transportation.delete",

        "fuel_log.view", "fuel_log.add", "fuel_log.edit", "fuel_log.delete",

        "dozer_log.view", "dozer_log.add", "dozer_log.edit", "dozer_log.delete",

        "vehicles.view", "vehicles.add", "vehicles.edit", "vehicles.delete",

        "materials.view", "materials.add", "materials.edit", "materials.delete",

        "vendors.view",  "vendors.add",  "vendors.edit",  "vendors.delete",

        "projects.view", "projects.add", "projects.edit", "projects.delete",

        "fuel_types.view", "fuel_types.add", "fuel_types.edit", "fuel_types.delete",

        "roles.view",    "roles.add",    "roles.edit",    "roles.delete",

        "permissions.view", "permissions.add", "permissions.edit", "permissions.delete",

        "role_permissions.view", "role_permissions.edit",

        "monthly_salary.view", "monthly_salary.edit",

        "salary_setup.view", "salary_setup.add", "salary_setup.edit", "salary_setup.delete",

        "salary_payment.view", "salary_payment.add", "salary_payment.edit", "salary_payment.delete",

        "salary_detail.view",

        "project_expenses.view", "project_expenses.add", "project_expenses.edit", "project_expenses.delete",

        "project_wages.view", "project_wages.add", "project_wages.edit", "project_wages.delete",

        "govt_offices.view", "govt_offices.add", "govt_offices.edit", "govt_offices.delete",
    ];

    foreach (var perm in permissions)
        options.AddPolicy(perm, policy => policy
            .RequireAuthenticatedUser()
            .AddRequirements(new PermissionRequirement(perm)));
});

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
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.Run();
