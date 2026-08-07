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
builder.Services.AddScoped<IExtraExpenseService, ExtraExpenseService>();
builder.Services.AddScoped<IGovernmentOfficeService, GovernmentOfficeService>();
builder.Services.AddScoped<IBankAccountService, BankAccountService>();
builder.Services.AddScoped<IProjectCommissionService, ProjectCommissionService>();
builder.Services.AddScoped<IVehicleMaintenanceLogService, VehicleMaintenanceLogService>();
builder.Services.AddScoped<IVehicleMaintenancePartService, VehicleMaintenancePartService>();
builder.Services.AddScoped<IVehicleMaintenanceWageService, VehicleMaintenanceWageService>();
builder.Services.AddScoped<IMaintenancePartService, MaintenancePartService>();
builder.Services.AddScoped<IPartyNameService, PartyNameService>();

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

        "vendor_management.view",

        "party_management.view",

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

        "project_commissions.view", "project_commissions.add", "project_commissions.edit", "project_commissions.delete",

        "vehicle_maintenance.view", "vehicle_maintenance.add", "vehicle_maintenance.edit", "vehicle_maintenance.delete",

        "maintenance_parts.view", "maintenance_parts.add", "maintenance_parts.edit", "maintenance_parts.delete",

        "party_names.view", "party_names.add", "party_names.edit", "party_names.delete",

        "extra_expenses.view", "extra_expenses.add", "extra_expenses.edit", "extra_expenses.delete", "extra_expenses.verify",

        "account_management.view",

        "bank_accounts.view", "bank_accounts.add", "bank_accounts.edit", "bank_accounts.delete",
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

var app = builder.Build();

// Auto-ensure recent table additions and permissions exist on startup
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS ""ExtraExpenses"" (
                ""Id""              SERIAL          PRIMARY KEY,
                ""ExpensedById""    INT             REFERENCES ""Users""(""Id"") ON DELETE SET NULL,
                ""ExpensedByOther"" VARCHAR(200),
                ""Item""            VARCHAR(200)    NOT NULL,
                ""Quantity""        NUMERIC(18, 2),
                ""Cost""            NUMERIC(18, 2),
                ""TotalCost""       NUMERIC(18, 2)  NOT NULL,
                ""Remarks""         VARCHAR(500),
                ""IsVerified""      BOOLEAN         NOT NULL DEFAULT FALSE,
                ""VerifiedById""    INT             REFERENCES ""Users""(""Id"") ON DELETE SET NULL,
                ""VerifiedAt""      TIMESTAMPTZ,
                ""Date""            DATE            NOT NULL,
                ""CreatedAt""       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                ""UpdatedAt""       TIMESTAMPTZ,
                ""CreatedById""     INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL,
                ""UpdatedById""     INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL,
                ""IsDeleted""       BOOLEAN         NOT NULL DEFAULT FALSE,
                ""DeletedOn""       TIMESTAMPTZ,
                ""DeletedById""     INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL
            );

            ALTER TABLE ""Transportations"" ADD COLUMN IF NOT EXISTS ""TotalWages"" NUMERIC(18, 2);

            CREATE TABLE IF NOT EXISTS ""BankAccounts"" (
                ""Id""              SERIAL          PRIMARY KEY,
                ""BankName""        VARCHAR(200)    NOT NULL,
                ""AccountHolder""  VARCHAR(200)    NOT NULL,
                ""AccountNumber""  VARCHAR(100)    NOT NULL,
                ""Branch""         VARCHAR(200),
                ""IsPrimary""      BOOLEAN         NOT NULL DEFAULT FALSE,
                ""TotalBalance""   NUMERIC(18, 2)  NOT NULL DEFAULT 0,
                ""CreatedAt""      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                ""UpdatedAt""      TIMESTAMPTZ,
                ""CreatedById""    INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL,
                ""UpdatedById""    INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL,
                ""IsDeleted""      BOOLEAN         NOT NULL DEFAULT FALSE,
                ""DeletedOn""      TIMESTAMPTZ,
                ""DeletedById""    INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL
            );

            ALTER TABLE ""BankAccounts""
            ADD COLUMN IF NOT EXISTS ""TotalBalance"" NUMERIC(18, 2) NOT NULL DEFAULT 0;

            CREATE TABLE IF NOT EXISTS ""BankAccountCreditLogs"" (
                ""Id""            SERIAL          PRIMARY KEY,
                ""BankAccountId"" INT             NOT NULL REFERENCES ""BankAccounts""(""Id"") ON DELETE RESTRICT,
                ""Amount""        NUMERIC(18, 2)  NOT NULL CHECK (""Amount"" > 0),
                ""LoggedOn""      DATE            NOT NULL,
                ""Remarks""       VARCHAR(500),
                ""CreatedAt""     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                ""UpdatedAt""     TIMESTAMPTZ,
                ""CreatedById""   INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL,
                ""UpdatedById""   INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL,
                ""IsDeleted""     BOOLEAN         NOT NULL DEFAULT FALSE,
                ""DeletedOn""     TIMESTAMPTZ,
                ""DeletedById""   INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL
            );

            ALTER TABLE ""Vendors""
            ADD COLUMN IF NOT EXISTS ""TotalBalance"" NUMERIC(18, 2) NOT NULL DEFAULT 0;

            CREATE TABLE IF NOT EXISTS ""VendorBalanceLogs"" (
                ""Id""            SERIAL          PRIMARY KEY,
                ""VendorId""      INT             NOT NULL REFERENCES ""Vendors""(""Id"") ON DELETE RESTRICT,
                ""BankAccountId"" INT             REFERENCES ""BankAccounts""(""Id"") ON DELETE SET NULL,
                ""EntryType""     VARCHAR(10)     NOT NULL CHECK (""EntryType"" IN ('credit', 'debit')),
                ""Amount""        NUMERIC(18, 2)  NOT NULL CHECK (""Amount"" > 0),
                ""LoggedOn""      DATE            NOT NULL,
                ""Remarks""       VARCHAR(500),
                ""CreatedAt""     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                ""UpdatedAt""     TIMESTAMPTZ,
                ""CreatedById""   INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL,
                ""UpdatedById""   INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL,
                ""IsDeleted""     BOOLEAN         NOT NULL DEFAULT FALSE,
                ""DeletedOn""     TIMESTAMPTZ,
                ""DeletedById""   INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS ""BankAccountDebitLogs"" (
                ""Id""            SERIAL          PRIMARY KEY,
                ""BankAccountId"" INT             NOT NULL REFERENCES ""BankAccounts""(""Id"") ON DELETE RESTRICT,
                ""VendorId""      INT             REFERENCES ""Vendors""(""Id"") ON DELETE SET NULL,
                ""Amount""        NUMERIC(18, 2)  NOT NULL CHECK (""Amount"" > 0),
                ""DebitedOn""     DATE            NOT NULL,
                ""Remarks""       VARCHAR(500),
                ""CreatedAt""     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                ""UpdatedAt""     TIMESTAMPTZ,
                ""CreatedById""   INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL,
                ""UpdatedById""   INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL,
                ""IsDeleted""     BOOLEAN         NOT NULL DEFAULT FALSE,
                ""DeletedOn""     TIMESTAMPTZ,
                ""DeletedById""   INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL
            );

            ALTER TABLE ""PartyNames""
            ADD COLUMN IF NOT EXISTS ""TotalBalance"" NUMERIC(18, 2) NOT NULL DEFAULT 0;

            CREATE TABLE IF NOT EXISTS ""PartyBalanceLogs"" (
                ""Id""          SERIAL          PRIMARY KEY,
                ""PartyNameId"" INT             NOT NULL REFERENCES ""PartyNames""(""Id"") ON DELETE RESTRICT,
                ""EntryType""   VARCHAR(10)     NOT NULL CHECK (""EntryType"" IN ('credit', 'debit')),
                ""Amount""      NUMERIC(18, 2)  NOT NULL CHECK (""Amount"" > 0),
                ""LoggedOn""    DATE            NOT NULL,
                ""Remarks""     VARCHAR(500),
                ""CreatedAt""   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
                ""UpdatedAt""   TIMESTAMPTZ,
                ""CreatedById"" INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL,
                ""UpdatedById"" INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL,
                ""IsDeleted""   BOOLEAN         NOT NULL DEFAULT FALSE,
                ""DeletedOn""   TIMESTAMPTZ,
                ""DeletedById"" INT REFERENCES ""Users""(""Id"") ON DELETE SET NULL
            );

            CREATE INDEX IF NOT EXISTS ""IX_PartyBalanceLogs_PartyNameId_LoggedOn""
            ON ""PartyBalanceLogs"" (""PartyNameId"", ""LoggedOn"" DESC);

            CREATE INDEX IF NOT EXISTS ""IX_VendorBalanceLogs_VendorId_LoggedOn""
            ON ""VendorBalanceLogs"" (""VendorId"", ""LoggedOn"" DESC);

            CREATE INDEX IF NOT EXISTS ""IX_BankAccountDebitLogs_BankAccountId_DebitedOn""
            ON ""BankAccountDebitLogs"" (""BankAccountId"", ""DebitedOn"" DESC);

            UPDATE ""BankAccounts"" a
            SET ""TotalBalance"" = COALESCE(s.""TotalBalance"", 0)
            FROM (
                SELECT ""BankAccountId"", SUM(""Amount"") AS ""TotalBalance""
                FROM ""BankAccountCreditLogs""
                WHERE NOT ""IsDeleted""
                GROUP BY ""BankAccountId""
            ) s
            WHERE s.""BankAccountId"" = a.""Id"";

            UPDATE ""BankAccounts"" a
            SET ""TotalBalance"" = a.""TotalBalance"" - COALESCE(s.""TotalDebited"", 0)
            FROM (
                SELECT ""BankAccountId"", SUM(""Amount"") AS ""TotalDebited""
                FROM ""BankAccountDebitLogs""
                WHERE NOT ""IsDeleted""
                GROUP BY ""BankAccountId""
            ) s
            WHERE s.""BankAccountId"" = a.""Id"";

            UPDATE ""Vendors"" v
            SET ""TotalBalance"" = COALESCE(s.""TotalBalance"", 0)
            FROM (
                SELECT ""VendorId"",
                       SUM(CASE WHEN ""EntryType"" = 'credit' THEN ""Amount"" ELSE -""Amount"" END) AS ""TotalBalance""
                FROM ""VendorBalanceLogs""
                WHERE NOT ""IsDeleted""
                GROUP BY ""VendorId""
            ) s
            WHERE s.""VendorId"" = v.""Id"";

            UPDATE ""PartyNames"" p
            SET ""TotalBalance"" = COALESCE(s.""TotalBalance"", 0)
            FROM (
                SELECT ""PartyNameId"",
                       SUM(CASE WHEN ""EntryType"" = 'credit' THEN ""Amount"" ELSE -""Amount"" END) AS ""TotalBalance""
                FROM ""PartyBalanceLogs""
                WHERE NOT ""IsDeleted""
                GROUP BY ""PartyNameId""
            ) s
            WHERE s.""PartyNameId"" = p.""Id"";

            INSERT INTO ""Permissions"" (""Name"", ""Description"", ""CreatedAt"")
            VALUES 
                ('extra_expenses.view', 'View extra expenses', NOW()),
                ('extra_expenses.add', 'Add extra expenses', NOW()),
                ('extra_expenses.edit', 'Edit extra expenses', NOW()),
                ('extra_expenses.delete', 'Delete extra expenses', NOW()),
                ('extra_expenses.verify', 'Verify extra expenses', NOW()),
                ('vendor_management.view', 'Access vendor management page', NOW()),
                ('party_management.view', 'Access party management page', NOW()),
                ('account_management.view', 'Access account management page', NOW()),
                ('bank_accounts.view', 'View bank accounts', NOW()),
                ('bank_accounts.add', 'Add bank accounts', NOW()),
                ('bank_accounts.edit', 'Edit bank accounts', NOW()),
                ('bank_accounts.delete', 'Delete bank accounts', NOW())
            ON CONFLICT (""Name"") DO NOTHING;

            INSERT INTO ""RolePermissions"" (""RoleId"", ""PermissionId"")
            SELECT r.""Id"", p.""Id""
            FROM ""Roles"" r
            CROSS JOIN ""Permissions"" p
            WHERE p.""Name"" IN ('extra_expenses.view', 'extra_expenses.add', 'bank_accounts.view', 'bank_accounts.add')
            ON CONFLICT DO NOTHING;

            INSERT INTO ""RolePermissions"" (""RoleId"", ""PermissionId"")
            SELECT 1, ""Id"" FROM ""Permissions"" WHERE ""Name"" LIKE 'extra_expenses.%' OR ""Name"" LIKE 'bank_accounts.%'
            ON CONFLICT DO NOTHING;

            INSERT INTO ""RolePermissions"" (""RoleId"", ""PermissionId"")
            SELECT r.""Id"", p.""Id""
            FROM ""Roles"" r
            JOIN ""Permissions"" p ON p.""Name"" IN ('account_management.view', 'vendor_management.view', 'party_management.view')
            WHERE r.""Name"" = 'Admin'
            ON CONFLICT DO NOTHING;
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[AutoMigration Warning] {ex.Message}");
    }
}

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
app.MapMethods("/health", ["GET", "HEAD"], () => Results.Ok(new { status = "healthy" }));

app.Run();
