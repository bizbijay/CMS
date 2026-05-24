# CMS — React + .NET 8 + SQL Server

A starter project with two apps:

- **backend/** — ASP.NET Core 8 Web API with JWT authentication, EF Core, and SQL Server.
- **frontend/** — React 18 + Vite + TypeScript + Tailwind CSS.
- **database/** — SQL Server creation script.

The first feature implemented is **user registration and login**.

---

## Prerequisites

- .NET 8 SDK — https://dotnet.microsoft.com/download
- Node.js 18+ and npm — https://nodejs.org
- SQL Server (LocalDB, Express, Developer, or full edition)
- (Optional) SSMS or Azure Data Studio to run the SQL script

---

## 1. Create the database

Open SSMS (or `sqlcmd`) and run `database/create_database.sql`. This creates the `CMS` database and a `Users` table.

```bash
# Example using sqlcmd against a local default instance
sqlcmd -S localhost -E -i database/create_database.sql
```

If you use a different server / instance, update the connection string in `backend/CMS.Api/appsettings.json`:

```json
"DefaultConnection": "Server=YOUR_SERVER;Database=CMS;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
```

For SQL authentication instead of Windows auth:

```
Server=YOUR_SERVER;Database=CMS;User Id=sa;Password=YOUR_PWD;TrustServerCertificate=True
```

---

## 2. Run the backend

```bash
cd backend/CMS.Api
dotnet restore
dotnet run
```

The API listens on `http://localhost:5080` (and `https://localhost:7080`). Swagger UI is available at `http://localhost:5080/swagger`.

### Endpoints

| Method | Path                | Auth        | Description                       |
|--------|---------------------|-------------|-----------------------------------|
| POST   | `/api/auth/register`| Anonymous   | Create a new user, returns JWT    |
| POST   | `/api/auth/login`   | Anonymous   | Sign in by username or email      |
| GET    | `/api/auth/me`      | Bearer JWT  | Return the current user           |

### Important: change the JWT secret

The `Jwt:Key` in `appsettings.json` is a placeholder. Replace it with a strong random 256-bit value before deploying anywhere real. For local development you can also store it in user secrets:

```bash
cd backend/CMS.Api
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "<your-long-random-secret>"
```

---

## 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to `http://localhost:5080`, so no extra CORS setup is needed during development.

For production builds, set `VITE_API_BASE_URL` (e.g. `https://api.example.com`) before running `npm run build`.

---

## Project layout

```
CMS/
├─ database/
│  └─ create_database.sql         # SQL Server schema
├─ backend/
│  ├─ CMS.sln
│  └─ CMS.Api/
│     ├─ Controllers/AuthController.cs
│     ├─ Data/AppDbContext.cs
│     ├─ DTOs/AuthDtos.cs
│     ├─ Models/User.cs
│     ├─ Services/JwtTokenService.cs
│     ├─ Program.cs
│     └─ appsettings.json
└─ frontend/
   ├─ index.html
   ├─ package.json
   ├─ vite.config.ts
   └─ src/
      ├─ App.tsx
      ├─ main.tsx
      ├─ index.css
      ├─ services/api.ts
      ├─ types/auth.ts
      ├─ components/ProtectedRoute.tsx
      └─ pages/
         ├─ Login.tsx
         ├─ Register.tsx
         └─ Home.tsx
```

---

## What's next

Suggested next steps once login/register works end-to-end:

1. Password reset flow (email + token).
2. Refresh tokens.
3. Roles / permissions (add a `Roles` and `UserRoles` table).
4. Account-level entities (e.g. Content, Categories) — the actual CMS data.
5. Frontend auth context (instead of reading `localStorage` directly in components).
