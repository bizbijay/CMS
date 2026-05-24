# CMS — Step-by-step free deployment guide (no credit card required)

This walks through deploying the app to a fully-free, no-card stack:

| Piece     | Host                       | Free tier                                       |
|-----------|----------------------------|-------------------------------------------------|
| Database  | Supabase (PostgreSQL)      | 500 MB database, 1 GB file storage, 2 projects  |
| Backend   | Render.com web service     | 512 MB RAM, sleeps after 15 min idle, 750 hrs/mo|
| Frontend  | Vercel                     | 100 GB bandwidth / month, unlimited static sites|

**Time budget:** about 45–60 minutes for a first-time run.

> **Note on the database switch.** Earlier versions of this project targeted Microsoft SQL Server on Azure. The free SQL Server hosting path effectively requires an Azure subscription, which needs a credit card that Azure will accept for verification (Nepali, Indian Rupay, and some prepaid cards are routinely rejected). The codebase has been moved to PostgreSQL via the Npgsql EF Core provider so we can use no-card hosts. The C# code didn't change beyond one line in `Program.cs`; EF Core handles the dialect differences for us.

---

## Table of contents

- [Phase 0 — Prerequisites](#phase-0--prerequisites)
- [Phase 1 — Run the new stack locally (optional but recommended)](#phase-1--run-the-new-stack-locally-optional-but-recommended)
- [Phase 2 — Push code to GitHub](#phase-2--push-code-to-github)
- [Phase 3 — Create the Supabase project](#phase-3--create-the-supabase-project)
- [Phase 4 — Create the Users table](#phase-4--create-the-users-table)
- [Phase 5 — Get the Supabase connection string](#phase-5--get-the-supabase-connection-string)
- [Phase 6 — Deploy the backend to Render](#phase-6--deploy-the-backend-to-render)
- [Phase 7 — Configure backend environment variables](#phase-7--configure-backend-environment-variables)
- [Phase 8 — Verify the backend](#phase-8--verify-the-backend)
- [Phase 9 — Deploy the frontend to Vercel](#phase-9--deploy-the-frontend-to-vercel)
- [Phase 10 — Wire the Vercel URL into CORS](#phase-10--wire-the-vercel-url-into-cors)
- [Phase 11 — End-to-end smoke test](#phase-11--end-to-end-smoke-test)
- [Operating notes & gotchas](#operating-notes--gotchas)
- [Troubleshooting](#troubleshooting)

---

## Phase 0 — Prerequisites

1. **GitHub account** — https://github.com/signup. No card needed.
2. **Supabase account** — https://supabase.com → *Start your project* → sign in with GitHub. No card needed for the free tier.
3. **Render account** — https://render.com → *Get Started* → sign in with GitHub. No card needed for the free tier.
4. **Vercel account** — https://vercel.com → sign in with GitHub. No card needed.
5. **Git installed** — `git --version` in a terminal should report 2.x or higher.
6. *(Optional, for local dev)* **PostgreSQL or Docker** to run the database locally. See Phase 1.

You should already have **.NET 8 SDK** and **Node.js 18+** installed from the earlier local-dev sections of `README.md`.

---

## Phase 1 — Run the new stack locally (optional but recommended)

The backend now talks to PostgreSQL instead of SQL Server. If you want to keep using the app locally while developing, you'll need a Postgres database. Two paths:

### Option A — Docker (easiest)

```bash
docker run -d --name cms-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cms \
  -p 5432:5432 \
  postgres:16
```

The default `appsettings.json` connection string already points at this:

```
Host=localhost;Port=5432;Database=cms;Username=postgres;Password=postgres
```

### Option B — Install Postgres natively

Windows installer: https://www.postgresql.org/download/windows/. During setup, set the postgres user password to `postgres` (or update the connection string to whatever you choose). Then create a `cms` database via pgAdmin or psql.

### Apply the schema

Either way, once Postgres is running, run the setup script. Using psql:

```bash
psql -h localhost -U postgres -d cms -f database/supabase_setup.sql
```

Or paste the contents of `database/supabase_setup.sql` into pgAdmin's Query Tool.

### Run the backend

```bash
cd backend/CMS.Api
dotnet restore
dotnet run
```

API listens on http://localhost:5080. You should see `{"service":"CMS.Api","status":"running"}` at the root.

### Run the frontend

```bash
cd frontend
npm install   # if you haven't already
npm run dev
```

Open http://localhost:5173. Register an account to confirm everything works against Postgres.

---

## Phase 2 — Push code to GitHub

Skip if your code is already on GitHub.

### 2.1 Initialize and commit

```bash
cd D:\CMS\CMS
git init
git add .
git commit -m "Initial commit"
```

### 2.2 Create the GitHub repo

1. Open https://github.com/new.
2. Repository name: `cms` (or anything).
3. Visibility: Public or Private — both work with Render and Vercel.
4. **Do not** check "Add a README" or any other initialization options.
5. Click **Create repository**.

GitHub gives you the push commands. Run them locally:

```bash
git remote add origin https://github.com/YOUR_USERNAME/cms.git
git branch -M main
git push -u origin main
```

### 2.3 Verify

Refresh the GitHub page. You should see `backend/`, `frontend/`, `database/`, `DEPLOYMENT.md`, `README.md`.

---

## Phase 3 — Create the Supabase project

### 3.1 Sign in and create a project

1. https://supabase.com/dashboard.
2. If this is your first time, you may need to create an *organization* first (use the default name).
3. Click **New project**.
4. Fill in:
   - **Project name**: `cms`
   - **Database password**: click *Generate a password* and **copy it** — Supabase shows it only once. This is your `postgres` user password.
   - **Region**: pick the one closest to you (e.g. *Southeast Asia (Singapore)* for Nepal).
   - **Pricing plan**: **Free**.
5. Click **Create new project**. Provisioning takes ~2 minutes.

### 3.2 Wait for the project to finish setting up

You'll see a progress indicator. When the project's home page loads with sections like "API URL", "Project URL", etc., you're done.

---

## Phase 4 — Create the Users table

### 4.1 Open the SQL Editor

1. In the Supabase project, left nav → **SQL Editor** (icon looks like `</>`).
2. Click **+ New query** (or the existing "Welcome" query is fine to overwrite).

### 4.2 Run the setup script

1. Open `database/supabase_setup.sql` from your repo in a text editor.
2. Copy the entire contents.
3. Paste into the Supabase SQL Editor.
4. Click **Run** (bottom-right, or `Ctrl+Enter`).
5. You should see "Success. No rows returned."

### 4.3 Verify

Paste and run:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema='public';
```

You should see one row: `Users`. Done.

---

## Phase 5 — Get the Supabase connection string

### 5.1 Find the connection string

1. Left nav → **Project Settings** (the gear icon at the bottom).
2. **Database** → scroll to **Connection string**.
3. Two tabs: **URI** and **PSQL**. We want **URI**.
4. Look at the dropdown showing connection modes. Use **Transaction Pooler** (also labeled "Session pooler" on some accounts — pick the one labeled for **pooler** on port `6543`, not the direct `5432`). Render runs your service on a shared IP that may not be IPv6-capable, and the Supabase pooler is reliably IPv4-friendly.

   The string looks like:

   ```
   postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres
   ```

5. Click the **Copy** button.

### 5.2 Convert to Npgsql format

Npgsql doesn't accept the `postgresql://` URI format directly in `appsettings.json`/env vars. Convert to key-value form.

If your URI is:

```
postgresql://postgres.abcdefgh:MyPassword!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

The Npgsql equivalent is:

```
Host=aws-0-ap-southeast-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.abcdefgh;Password=MyPassword!;SSL Mode=Require;Trust Server Certificate=true
```

Save this in a text file — you'll paste it into Render in Phase 7.

> **Important fields:**
> - `SSL Mode=Require` — Supabase enforces TLS.
> - `Trust Server Certificate=true` — easiest way to avoid CA-chain validation noise from inside Docker.
> - The username is `postgres.xxxxxxxx`, not just `postgres`. That's deliberate — Supabase uses this format for the pooler.

---

## Phase 6 — Deploy the backend to Render

### 6.1 Start a new web service

1. https://dashboard.render.com.
2. Top-right → **+ New** → **Web Service**.
3. Connect your GitHub account if you haven't already (Render asks for repo access).
4. Find `cms` in the list and click **Connect**.

### 6.2 Configure the service

| Field             | Value                                       |
|-------------------|---------------------------------------------|
| Name              | `cms-api` (this becomes `cms-api.onrender.com`) |
| Region            | Pick the closest to Supabase region        |
| Branch            | `main`                                      |
| Root Directory    | `backend/CMS.Api`                           |
| Environment       | **Docker** (auto-detected from Dockerfile)  |
| Dockerfile Path   | `./Dockerfile` (default once Root Directory is set) |
| Instance Type     | **Free**                                    |

Scroll down. Leave **Auto-Deploy** on (deploys on every push to `main`).

Don't click Create yet — set env vars first.

### 6.3 Add environment variables

Scroll to **Environment Variables**. Click **Add Environment Variable** for each:

| Name                                       | Value                                                                          |
|--------------------------------------------|--------------------------------------------------------------------------------|
| `ConnectionStrings__DefaultConnection`     | The Npgsql connection string from Phase 5.2                                    |
| `Jwt__Key`                                 | A long random secret. Paste 64+ random characters                              |
| `Jwt__Issuer`                              | `CMS.Api`                                                                      |
| `Jwt__Audience`                            | `CMS.Client`                                                                   |
| `Jwt__ExpiresInMinutes`                    | `120`                                                                          |
| `Cors__AllowedOrigins`                     | Leave empty for now — we'll fill in the Vercel URL in Phase 10                 |
| `ASPNETCORE_ENVIRONMENT`                   | `Production`                                                                   |

Don't set `PORT` — Render injects it automatically and `Program.cs` reads it.

### 6.4 Create the service

Click **Create Web Service** at the bottom.

Render starts building the Docker image. You'll see live logs:

```
==> Building...
[+] Building 0.3s (5/5) FINISHED
...
==> Deploying...
==> Your service is live 🎉
```

The first build takes 4–7 minutes (downloading .NET SDK + restoring NuGet packages). Subsequent builds are faster thanks to Docker layer caching.

### 6.5 Verify the deploy

When you see "Your service is live", click the URL at the top (e.g. `https://cms-api.onrender.com`).

Expected: `{"service":"CMS.Api","status":"running"}`

If the first request takes 30+ seconds, that's the Render free-tier cold start. Subsequent requests within 15 minutes are instant; after that the service sleeps.

---

## Phase 7 — Configure backend environment variables

Already done in Phase 6.3. If you missed one or want to change a value:

1. Render dashboard → your service → **Environment** in the left nav.
2. **Add Environment Variable** or click the **⋯** on an existing one to edit.
3. **Save Changes** at the bottom.
4. Render re-deploys automatically (~2 min).

---

## Phase 8 — Verify the backend

### 8.1 Root endpoint

Open `https://cms-api.onrender.com/` (or whatever your Render URL is).

Expected: `{"service":"CMS.Api","status":"running"}`

### 8.2 Register through curl

```bash
curl -i -X POST https://cms-api.onrender.com/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"smoketest\",\"email\":\"smoke@test.com\",\"password\":\"Test1234!\"}"
```

*(Mac/Linux: replace `^` with `\`.)*

Expected:
- `HTTP/2 200` with a JSON body containing `token`, `expiresAt`, and `user`.
- First call may take 30–60 seconds due to Render + Supabase cold starts.

### 8.3 Confirm the user landed in Supabase

In the Supabase dashboard → **Table Editor** → `Users`. You should see one row with `Username = smoketest`. Refresh if needed.

---

## Phase 9 — Deploy the frontend to Vercel

### 9.1 Import the repo

1. https://vercel.com/new.
2. Pick `cms` from your GitHub repos and click **Import**.
   (If you don't see it: **Adjust GitHub App Permissions** → grant access.)

### 9.2 Configure

| Section                  | Setting                                                                  |
|--------------------------|--------------------------------------------------------------------------|
| Project Name             | `cms` (or anything)                                                      |
| Framework Preset         | **Vite** (auto-detected once Root Directory is set)                      |
| **Root Directory**       | Click **Edit** → navigate into `frontend` → **Continue**. Required.       |
| Build / Output           | Leave defaults: `npm run build`, output `dist`                            |

Expand **Environment Variables**:

| Name                | Value                                                  |
|---------------------|--------------------------------------------------------|
| `VITE_API_BASE_URL` | `https://cms-api.onrender.com` (no trailing slash)     |

### 9.3 Deploy

Click **Deploy**. Vercel runs `npm install && npm run build`. ~60–90 seconds.

When done, click **Visit**. You should see the Login page.

You can't log in yet — CORS is still locked to localhost. Next phase fixes that.

---

## Phase 10 — Wire the Vercel URL into CORS

### 10.1 Get the Vercel production URL

In Vercel → your project → top of page shows the production URL, e.g. `https://cms-abc123.vercel.app`. Copy it.

### 10.2 Add it to Render

1. Render dashboard → your service → **Environment**.
2. Click the **⋯** on `Cors__AllowedOrigins` → **Edit**.
3. Paste the Vercel URL (no trailing slash):
   ```
   https://cms-abc123.vercel.app
   ```
4. **Save Changes**. Render redeploys automatically (~2 min).

To support multiple origins later (a custom domain, preview URLs, etc.), comma-separate:
```
https://cms-abc123.vercel.app,https://www.example.com
```

---

## Phase 11 — End-to-end smoke test

1. Open your Vercel URL in a fresh browser tab.
2. Click **Register**. Use a password matching the policy (8+ chars, upper, lower, digit, special — e.g. `Admin123!`).
3. Submit. Expect the dashboard to load with your name in the top-right.
4. Click the avatar → **Change password** → set a new password.
5. Sidebar → **Users** → **+ Add user**. Create a second account.
6. Click the pencil to edit, the trash to delete (not your own row).
7. Sign out via the avatar menu, then sign back in with the new password.

If everything works: **deployment is complete and your bill is $0/month**.

---

## Operating notes & gotchas

### Cold starts
- **Render free tier** sleeps after 15 minutes idle. First request post-sleep takes 30–60 seconds while the Docker container restarts.
- **Supabase free** doesn't auto-pause the database, but inactive projects get **paused after 1 week of no activity**. You'll get an email; just visit the dashboard or hit a query to unpause.

### Keep-warm (optional)
Hit `https://cms-api.onrender.com/` every 10–14 minutes from a free cron service (https://cron-job.org has a free tier). Stay under the 750 hours/month budget if you want it warm 24/7 — actually 750 hours is more than a month, so a single always-warm service is well within the limit.

### Pushing updates
- **Backend**: `git push origin main` → Render rebuilds and redeploys (~3–5 min). Watch logs in the Render dashboard.
- **Frontend**: same — Vercel auto-deploys on push. Other branches get preview URLs.

### Updating secrets
- Changing `Jwt__Key` in Render invalidates every existing JWT. Users get logged out.
- Changing `Cors__AllowedOrigins` does not invalidate sessions; it just refreshes the allowed-origin header on the next request.

### Adding a custom domain
- **Vercel**: Project → Settings → Domains. Free for any domain you own; Vercel manages the TLS cert.
- After adding the custom domain, append it to `Cors__AllowedOrigins` in Render.

### Supabase pooler vs. direct connection
- We used the **pooler** (port 6543) because Render IPs aren't IPv6-capable and the direct Supabase IP can be IPv6-only depending on region.
- The pooler runs PgBouncer in *transaction mode*; it works fine for EF Core with a small caveat: avoid long-running transactions and prepared statements that depend on session state.

### Migrating data
- The `Users` table is the only table for now. If you want to move data from a local Postgres to Supabase, use `pg_dump`:
  ```bash
  pg_dump -h localhost -U postgres -d cms -t Users --data-only > users.sql
  ```
  Then run `users.sql` in the Supabase SQL editor.

---

## Troubleshooting

### Backend: deploy logs show "Could not load file or assembly 'Microsoft.EntityFrameworkCore.SqlServer'"
Did you `git push` the new `CMS.Api.csproj`? Render builds from the latest commit on `main`; check the Render build log for the commit SHA it's building.

### Backend: 500 on every call, log shows "Npgsql.NpgsqlException: connection refused"
Likely connection-string issue. Common causes:

1. **Wrong port** — Supabase pooler is `6543`, not `5432`.
2. **Missing `SSL Mode=Require`** — Supabase rejects unencrypted connections.
3. **Username copied as just `postgres`** — the pooler username is `postgres.<project_ref>`.

### Backend: log shows "FATAL: Tenant or user not found"
The connection-string username is wrong. In Supabase → Settings → Database → Connection string, copy the URI mode carefully; the username includes a dot and the project reference.

### Backend: log shows "Cannot write DateTime with Kind=Local"
Make sure you're saving UTC timestamps (`DateTime.UtcNow`, not `DateTime.Now`). The codebase already does this everywhere; this error would only show if you added new code that uses `DateTime.Now`.

### Frontend: `Failed to fetch` errors
Open browser DevTools → Network tab. If the call goes to `localhost:5080`, it means `VITE_API_BASE_URL` wasn't set at build time. Vercel bakes env vars in during build, so after adding/changing it you must **redeploy**: Vercel → Deployments → ⋯ → Redeploy.

### Frontend: CORS errors
The browser shows `Access to fetch at '...' from origin '...' has been blocked`. Means `Cors__AllowedOrigins` in Render doesn't match your Vercel origin exactly. Common mistakes:

- Missing `https://` scheme.
- Trailing slash on the value.
- The URL is a preview deploy URL (`cms-git-feature-username.vercel.app`) but you only whitelisted the production URL.

### Frontend: 401 on every authenticated call
- `Jwt__Key` env var changed between login and now → log out and back in.
- Or Render restarted with new env vars but the JWT is still issued by the old config → log out and back in.

### Render: "Your free tier hours are exhausted"
Render free tier is 750 hours per month per workspace. One service running 24/7 ≈ 730 hours, so a single service is fine. If you have multiple free services they share the budget.

### Supabase: project paused
Free projects pause after 7 days of inactivity. Reactivate from the Supabase dashboard — just clicking into the project usually does it.

---

## File reference

- `database/supabase_setup.sql` — PostgreSQL schema for Supabase / Neon / any Postgres.
- `database/create_database.sql` — **legacy** SQL Server script (kept for reference; not used by the current code).
- `database/azure_setup.sql` — **legacy** Azure SQL script (same reason).
- `backend/CMS.Api/Dockerfile` — multi-stage build used by Render.
- `backend/CMS.Api/Program.cs` — reads `Jwt:Key`, `ConnectionStrings:DefaultConnection`, `Cors:AllowedOrigins`, and `PORT` from any IConfiguration source. Env vars take precedence.
- `backend/CMS.Api/appsettings.json` — local + placeholder values; **never commit real secrets**.
- `frontend/src/services/api.ts` — uses `VITE_API_BASE_URL`. Empty → relative paths (Vite proxy in dev). Absolute → production API host.
