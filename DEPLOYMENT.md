# CMS — Step-by-step free deployment guide

This walks through deploying the entire app to a **$0/month** stack:

| Piece     | Host                          | Free tier limits                                  |
|-----------|-------------------------------|---------------------------------------------------|
| Database  | Azure SQL Database (Free)     | 32 GB storage, 100,000 vCore-seconds / month      |
| Backend   | Azure App Service (F1 Free)   | 60 CPU minutes / day, 1 GB RAM, sleeps when idle  |
| Frontend  | Vercel                        | 100 GB bandwidth / month, unlimited static sites  |

**Time budget:** about 45–60 minutes if it's your first time.

---

## Table of contents

- [Phase 0 — Prerequisites](#phase-0--prerequisites)
- [Phase 1 — Push code to GitHub](#phase-1--push-code-to-github)
- [Phase 2 — Create the Azure SQL Database](#phase-2--create-the-azure-sql-database)
- [Phase 3 — Create the User table](#phase-3--create-the-user-table)
- [Phase 4 — Get the SQL connection string](#phase-4--get-the-sql-connection-string)
- [Phase 5 — Create the App Service for the backend](#phase-5--create-the-app-service-for-the-backend)
- [Phase 6 — Fix the GitHub Actions workflow](#phase-6--fix-the-github-actions-workflow)
- [Phase 7 — Configure backend environment variables](#phase-7--configure-backend-environment-variables)
- [Phase 8 — Verify the backend](#phase-8--verify-the-backend)
- [Phase 9 — Deploy the frontend to Vercel](#phase-9--deploy-the-frontend-to-vercel)
- [Phase 10 — Wire the Vercel URL into CORS](#phase-10--wire-the-vercel-url-into-cors)
- [Phase 11 — End-to-end smoke test](#phase-11--end-to-end-smoke-test)
- [Operating notes & gotchas](#operating-notes--gotchas)
- [Troubleshooting](#troubleshooting)

---

## Phase 0 — Prerequisites

You'll need:

1. **A GitHub account** — https://github.com/signup if you don't have one.
2. **An Azure account** — https://azure.microsoft.com/free. Sign up requires a credit card for identity verification, but **none of the resources in this guide will charge you** as long as you follow the steps exactly.
3. **A Vercel account** — https://vercel.com/signup. Sign in with your GitHub account; that links them so deploys are one-click.
4. **Git installed locally** — verify with `git --version` in a terminal.
5. *(Optional but recommended)* A password generator. You'll need to invent two strong passwords during this guide: one for the SQL admin, one for the JWT signing key.

---

## Phase 1 — Push code to GitHub

If your code is already on GitHub, skip to Phase 2.

### 1.1 Initialize the repo locally

Open a terminal in `D:\CMS\CMS` (the folder that contains `backend/`, `frontend/`, `database/`, `README.md`, `DEPLOYMENT.md`):

```bash
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Create the GitHub repo

1. Open https://github.com/new.
2. **Repository name**: `cms` (or anything you like).
3. **Visibility**: Public or Private — both work with Vercel and Azure.
4. **Do not** check "Add a README" / "Add .gitignore" / "Choose a license" — your folder already has them.
5. Click **Create repository**.

GitHub shows you a "…push an existing repository from the command line" block. Copy the three commands and run them locally. They look like:

```bash
git remote add origin https://github.com/YOUR_USERNAME/cms.git
git branch -M main
git push -u origin main
```

### 1.3 Verify

Refresh the GitHub page — you should see `backend/`, `frontend/`, `database/`, `DEPLOYMENT.md`, `README.md`.

---

## Phase 2 — Create the Azure SQL Database

### 2.1 Open the Azure Portal

1. Go to https://portal.azure.com.
2. Sign in.
3. If this is a brand-new account you may see a "Get started" tour — close it.

### 2.2 Start the "SQL databases" wizard

1. In the top search bar, type **SQL databases** and click the matching service.
2. On the **SQL databases** page, click **+ Create** (top-left).

### 2.3 Fill in the Basics tab

| Field                    | Value                                                                 |
|--------------------------|-----------------------------------------------------------------------|
| Subscription             | Your free subscription (usually "Azure subscription 1")               |
| Resource group           | Click **Create new** → `cms-rg` → OK                                  |
| Database name            | `CMS`                                                                 |
| Server                   | Click **Create new** → fill in the form below                         |
| Want to use SQL elastic pool? | **No**                                                           |
| Workload environment     | **Development**                                                       |

**Server form (opens as a side blade):**

| Field                  | Value                                                                                                |
|------------------------|------------------------------------------------------------------------------------------------------|
| Server name            | Globally unique, e.g. `cms-yourname-2026`. Becomes `<name>.database.windows.net`                     |
| Location               | Pick the region closest to you (e.g. *UK South*, *East US*). **Remember this** — App Service uses the same region |
| Authentication method  | **Use SQL authentication**                                                                           |
| Server admin login     | e.g. `cmsadmin` (don't use `admin` — Azure blocks it)                                                |
| Password               | Strong password (12+ chars, mixed case, digit, symbol). **Write this down.**                         |
| Confirm password       | Repeat                                                                                               |

Click **OK** to close the server blade.

### 2.4 Configure the free compute tier (this is the critical step)

1. Still on the Basics tab, scroll to **Compute + storage** and click **Configure database**.
2. The "Configure" blade opens.
3. At the top there's a banner: **"Apply offer for free Azure SQL Database"**. **Tick the checkbox.** This is the always-free 100k vCore-seconds offer; missing it means you'll pay.
4. The tier auto-switches to **General Purpose — Serverless, Standard-series (Gen5)** with the free limits applied.
5. **Auto-pause delay**: leave at 1 hour (default). This is what makes serverless free — the DB pauses when idle.
6. Click **Apply**.

### 2.5 Skip to Networking

Click **Next: Networking >** at the bottom.

| Field                                                       | Value                                |
|-------------------------------------------------------------|--------------------------------------|
| Network connectivity                                        | **Public endpoint**                  |
| Allow Azure services and resources to access this server    | **Yes** ← required for App Service   |
| Add current client IPv4 address                             | **Yes** ← required so you can run the setup script from the Query Editor |
| Connection policy                                           | Default                              |
| Encrypted connections / TLS                                 | Default                              |

### 2.6 Skip the remaining tabs and create

Click **Review + create** at the bottom (you can skip Security, Additional settings, Tags). The validation should pass and show an estimated cost of **$0** if you applied the free offer.

Click **Create**. Wait ~3 minutes — Azure provisions the SQL server + database.

### 2.7 Verify

When you see "Your deployment is complete", click **Go to resource**. You should land on the `CMS` database overview page. The breadcrumb at the top should read something like `cms-yourname-2026 (server) > CMS (database)`.

---

## Phase 3 — Create the User table

### 3.1 Open the Query Editor

1. On the `CMS` database page, in the left nav scroll down to **Query editor (preview)** and click it.
2. A login prompt appears. Use:
   - **SQL server authentication**
   - Login: the admin login from Phase 2.3 (e.g. `cmsadmin`)
   - Password: the admin password.
3. Click **OK**.

**If you see "Cannot open server requested by the login":** your client IP wasn't whitelisted (you skipped or said No to step 2.5). Go to the SQL **server** (not database) → **Networking** → **Public access** → **Add your client IPv4 address** → **Save**. Try Query Editor again.

### 3.2 Run the setup script

1. Open the `azure_setup.sql` file from your repo in a text editor: [database/azure_setup.sql](database/azure_setup.sql).
2. Copy its entire contents.
3. Paste into the Azure Query Editor.
4. Click **▶ Run** (the green play button at the top).
5. Below the editor, you should see:
   ```
   Creating table dbo.Users...
   Azure SQL setup complete.
   Query succeeded
   ```

### 3.3 Verify

In the Query Editor, paste and run:

```sql
SELECT name FROM sys.tables;
```

You should see a single row: `Users`.

---

## Phase 4 — Get the SQL connection string

1. Still on the `CMS` database page, in the left nav click **Settings → Connection strings**.
2. The **ADO.NET (SQL authentication)** string is shown. It looks like:

   ```
   Server=tcp:cms-yourname-2026.database.windows.net,1433;Initial Catalog=CMS;Persist Security Info=False;User ID={your_username};Password={your_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
   ```

3. Copy it. Open Notepad (or any text editor) and paste.
4. Replace `{your_username}` with the admin login (e.g. `cmsadmin`).
5. Replace `{your_password}` with the admin password.
6. **Save this somewhere safe** — you'll paste it into App Service in Phase 7. **Do not commit it to git.**

---

## Phase 5 — Create the App Service for the backend

### 5.1 Start the Web App wizard

1. In the Azure Portal search bar, type **App services** and click the matching service.
2. Click **+ Create** → **Web App**.

### 5.2 Basics tab

| Field             | Value                                                                                                       |
|-------------------|-------------------------------------------------------------------------------------------------------------|
| Subscription      | Same as the database                                                                                        |
| Resource group    | `cms-rg`                                                                                                    |
| Name              | Globally unique, e.g. `cms-api-yourname-2026`. The URL becomes `https://<name>.azurewebsites.net`           |
| Publish           | **Code**                                                                                                    |
| Runtime stack     | **.NET 8 (LTS)**                                                                                            |
| Operating System  | **Linux**                                                                                                   |
| Region            | **Same region as the database**                                                                             |

### 5.3 Pick the F1 Free pricing plan

This step is easy to miss. Azure defaults to a **paid** plan (Premium V3).

1. Under **Pricing plan**, click **Explore pricing plans**.
2. A panel slides in. Tabs along the top: *Production*, *Dev/Test*. Click **Dev/Test**.
3. Find the **F1 Free** card (1 GB memory, 60 CPU minutes/day, no SLA). Click **Select**.

Back on the Basics page, the plan should now show **F1 Free**.

> If "F1" doesn't appear, switch the **Operating System** to Linux (some regions only show F1 on Linux), or try a different Region.

### 5.4 Deployment tab — connect GitHub

Click **Next: Database >** (skip — we already have one) → **Next: Deployment >**.

| Field                       | Value                                                       |
|-----------------------------|-------------------------------------------------------------|
| Continuous deployment       | **Enable**                                                  |
| Basic authentication        | Default (Enable)                                            |
| GitHub account              | Click **Sign in** and authorize Azure                       |
| Organization                | Your GitHub username                                        |
| Repository                  | `cms` (the repo from Phase 1)                               |
| Branch                      | `main`                                                      |
| Authentication type         | **User-assigned identity** if available, else Basic         |

### 5.5 Skip the rest

Click **Review + create** → wait for validation → **Create**. Wait ~2 minutes.

When done, click **Go to resource**. You should see the App Service overview with the URL `https://cms-api-yourname-2026.azurewebsites.net`.

### 5.6 Watch the first deploy (it will fail — that's expected)

Open a new tab to your GitHub repo → **Actions**. You should see a workflow run started by Azure (something like "Build and deploy ASP.Net Core app"). Click into it.

It will likely **fail on the build step** with an error like:
```
The project file could not be found.
Could not find any project in `/home/runner/work/cms/cms`.
```

That's because the workflow defaults to building from the repo root, but our `.csproj` lives in `backend/CMS.Api`. Fix it next.

---

## Phase 6 — Fix the GitHub Actions workflow

### 6.1 Pull the new workflow file

Azure has committed a workflow file to your repo. Pull it down:

```bash
git pull
```

You should now have a new file at `.github/workflows/main_cms-api-yourname-2026.yml` (the name includes your app's name).

### 6.2 Edit the workflow

Open that YAML file. Look for the build job and find these lines (or similar):

```yaml
      - name: Build with dotnet
        run: dotnet build --configuration Release

      - name: dotnet publish
        run: dotnet publish -c Release -o "${{env.DOTNET_ROOT}}/myapp"
```

Replace **both** with:

```yaml
      - name: Build with dotnet
        working-directory: backend/CMS.Api
        run: dotnet build --configuration Release

      - name: dotnet publish
        working-directory: backend/CMS.Api
        run: dotnet publish -c Release -o "${{env.DOTNET_ROOT}}/myapp"
```

Save.

### 6.3 Commit and push

```bash
git add .github/workflows
git commit -m "Point workflow at backend/CMS.Api"
git push
```

### 6.4 Watch the new deploy

Back on GitHub → Actions. A new run starts automatically. It should now succeed within ~3–5 minutes. You'll see:

- ✓ Build
- ✓ deploy

### 6.5 Verify the raw deploy

Open `https://cms-api-yourname-2026.azurewebsites.net/` in a browser. You should see **either**:

- `{"service":"CMS.Api","status":"running"}` — **success!**
- Or a 500 error / "An error occurred" — that's because env vars are missing. Continue to Phase 7.
- The first request might also take **20–40 seconds** (F1 cold start). Refresh once if it times out.

---

## Phase 7 — Configure backend environment variables

The app reads connection string, JWT key, and CORS origins from configuration. In production these come from App Service env vars.

### 7.1 Open the env-var blade

1. Azure Portal → your App Service.
2. Left nav → **Settings → Environment variables** (or **Configuration** in older UIs).
3. Default tab is **App settings**.

### 7.2 Add each setting

Click **+ Add** for each row. Set Name and Value, leave "Deployment slot setting" unchecked.

| Name                                       | Value                                                                                                         |
|--------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| `ConnectionStrings__DefaultConnection`     | The full ADO.NET string from Phase 4 (with username + password filled in)                                     |
| `Jwt__Key`                                 | A long random secret. Paste 64+ characters from a password generator. Example: `8h7sLZ2pK!9vXqR3...`          |
| `Jwt__Issuer`                              | `CMS.Api`                                                                                                     |
| `Jwt__Audience`                            | `CMS.Client`                                                                                                  |
| `Jwt__ExpiresInMinutes`                    | `120`                                                                                                         |
| `Cors__AllowedOrigins`                     | Leave blank for now — we add the Vercel URL in Phase 10                                                       |
| `ASPNETCORE_ENVIRONMENT`                   | `Production`                                                                                                  |

> The `__` (double underscore) is how App Service maps env-var names to nested config keys. `Jwt__Key` becomes `Jwt:Key` in the app.

### 7.3 Save and restart

Click **Apply** at the bottom → **Confirm**. App Service restarts automatically (~30 seconds).

---

## Phase 8 — Verify the backend

### 8.1 Hit the root

Browse to `https://cms-api-yourname-2026.azurewebsites.net/`.

Expected: `{"service":"CMS.Api","status":"running"}`

### 8.2 Hit Swagger (Development-only — should NOT exist in Production)

Browse to `https://cms-api-yourname-2026.azurewebsites.net/swagger`.

Expected: **404 Not Found**. That's correct — Swagger is gated to Development.

### 8.3 Try an auth call

Open a terminal and run:

```bash
curl -i -X POST https://cms-api-yourname-2026.azurewebsites.net/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"smoketest\",\"email\":\"smoke@test.com\",\"password\":\"Test1234!\"}"
```

*(Linux/Mac: replace `^` with `\` and use single quotes.)*

Expected:
- `HTTP/2 200` with a JSON body containing a `token`.
- **First call might take 60 seconds** if both the App Service and the SQL DB are warming up.

If you get this far, the backend + database are fully working.

---

## Phase 9 — Deploy the frontend to Vercel

### 9.1 Import the repo

1. Go to https://vercel.com/new.
2. The page lists your GitHub repos. Find `cms` and click **Import**.
3. (If `cms` isn't listed: click **Adjust GitHub App Permissions** and grant Vercel access to the repo.)

### 9.2 Configure the project

This page has several sections. **The Root Directory step is critical.**

| Section                  | Setting                                                                  |
|--------------------------|--------------------------------------------------------------------------|
| Project Name             | `cms` (or anything)                                                      |
| Framework Preset         | Should auto-detect **Vite** once you set Root Directory                   |
| **Root Directory**       | Click **Edit**, navigate into `frontend`, click **Continue**. Required.   |
| Build and Output Settings| Leave defaults: build = `npm run build`, output = `dist`                  |
| Install Command          | Leave default                                                            |

### 9.3 Add the env var

Expand **Environment Variables**:

| Name                | Value                                                  |
|---------------------|--------------------------------------------------------|
| `VITE_API_BASE_URL` | `https://cms-api-yourname-2026.azurewebsites.net`      |

**No trailing slash.** This URL is prepended to every `/api/...` call. If you include a trailing slash you'll get `//api/...` and 404s.

### 9.4 Deploy

Click **Deploy** at the bottom. Vercel runs `npm install && npm run build`. Expect ~1 minute.

When done you'll see "Congratulations!" with a screenshot of your site and a URL like `https://cms-xyz123.vercel.app`. Click **Visit**.

### 9.5 Expected state

The page should load and you should see the **Login** screen. **You cannot log in yet** — the next phase wires CORS so the browser is allowed to call the backend.

---

## Phase 10 — Wire the Vercel URL into CORS

### 10.1 Get the Vercel URL

In Vercel, on the project page, copy the **Production** URL. It's something like `https://cms-xyz123.vercel.app`. (Vercel also gives each branch its own preview URL; we only need the production one.)

### 10.2 Add it to App Service

1. Azure Portal → your App Service → **Settings → Environment variables**.
2. Find `Cors__AllowedOrigins` and click it.
3. Set the value to your Vercel URL (no trailing slash):
   ```
   https://cms-xyz123.vercel.app
   ```
4. Save → **Apply** → **Confirm**.

If you want both the Vercel preview and a custom domain later, comma-separate:
```
https://cms-xyz123.vercel.app,https://www.example.com
```

### 10.3 Wait for restart

App Service restarts (~30 seconds). The browser will get the new CORS headers on its next preflight.

---

## Phase 11 — End-to-end smoke test

1. Open your Vercel URL in a fresh browser tab.
2. Click **Register**. Use:
   - Username: `admin`
   - Email: anything
   - Password: must satisfy the policy — try `Admin123!`
3. Submit. Expect the dashboard to load with your name in the top-right.
4. Click the avatar → **Change password** → set a new one.
5. Sidebar → **Users**. Click **+ Add user**. Create a second account.
6. In the new row, click the **pencil** icon. Edit the first name and save.
7. Hover the **trash** on a different row (not your own) → confirm delete.
8. Sign out from the avatar dropdown, then sign back in with the new password.

If all of that works, you're done. **Total monthly cost: $0.**

---

## Operating notes & gotchas

### Cold starts
- **App Service F1** sleeps after ~20 minutes idle. First request post-sleep takes 20–40 seconds. There's no "Always On" toggle on F1 (it's a paid feature on Basic+).
- **Azure SQL serverless free** also auto-pauses. First connect after pause adds another 30–60 seconds.
- A user hitting the app after both have slept can wait 60–90 seconds for the first response. After that, it's instant.

### How to keep them warm (cheaply)
- Hit `https://<your-app>.azurewebsites.net/` every 15 minutes from a cron service (e.g. https://cron-job.org free tier). The endpoint returns `{ status: "running" }` and that's enough to keep the App Service warm. The DB will still pause unless your endpoint actually queries it.
- Inside the 60 CPU min/day budget, you can hit it every 5 min without exhausting the quota.

### Pushing updates
- **Backend**: `git push origin main` → GitHub Actions builds and deploys automatically. Watch the run on the Actions tab. Deploy time ~2–3 min.
- **Frontend**: same — Vercel auto-deploys on push to `main`. Other branches get preview URLs.

### Rotating the JWT key
- Updating `Jwt__Key` in App Service invalidates every existing token. Users will be forced to sign in again. Not a problem in production, but heads-up.

### Adding a custom domain
- **Vercel** custom domain → Project → Settings → Domains. Free for any domain you own; Vercel manages the TLS cert.
- After adding the custom domain, also append it to App Service `Cors__AllowedOrigins`.

### Migrating off Azure SQL later
- If you want to leave Azure for cheaper non-Azure hosting (Postgres on Supabase / Neon / Fly), swap `Microsoft.EntityFrameworkCore.SqlServer` for `Npgsql.EntityFrameworkCore.PostgreSQL` and rewrite `database/*.sql`. The C# code itself doesn't change thanks to EF Core's provider abstraction.

---

## Troubleshooting

### Backend: 500 errors on every call
Most likely a missing or wrong env var. App Service → **Log stream** (left nav) → watch the live logs as you hit the API. The exception message names the missing config.

### Backend: "Could not open a connection to SQL Server"
Two common causes:

1. **"Allow Azure services to access this server" is OFF.** Fix: SQL server → Networking → set it to Yes → Save.
2. **Connection string username/password placeholders not replaced.** The string still says `{your_password}` literally. Re-paste with real values.

### Backend: "Login failed for user 'cmsadmin'"
The connection string username/password don't match what you set in Phase 2.3. Reset the password via SQL server → "Reset password" if you've forgotten it.

### Backend: deploys succeed but `/` still returns the default Azure landing page
The deployment didn't actually update the site. Symptoms: GitHub Actions shows green but `/` shows "Your Azure App Service app is up and running". Usually means the publish output is in the wrong path. Re-check the `working-directory` lines in `.github/workflows/main_*.yml`.

### Frontend: blank white page
Open browser DevTools → Console. Two common causes:

1. **`Failed to fetch`** with no Network call shown — usually the `VITE_API_BASE_URL` env var was empty at build time. Vercel injects env vars at build time, not runtime, so you need to **redeploy** after adding it. In Vercel → Deployments → ⋯ → Redeploy.
2. **CORS error**: `Access to fetch at 'https://...' from origin 'https://...' has been blocked`. Means `Cors__AllowedOrigins` in App Service doesn't include the Vercel URL exactly. Common mistakes:
   - Missing `https://` scheme.
   - Trailing slash on the value (`https://cms.vercel.app/` is treated as a different origin from `https://cms.vercel.app`).
   - The URL changed because Vercel re-assigned a preview to production — use the canonical production URL.

### Frontend: 401 on every authenticated call
Open DevTools → Application → Local storage → check `cms.token` exists. If it does and you still get 401:

- Your `Jwt__Key` env var changed between when you logged in and now → log out and back in.
- Or the App Service has multiple Linux instances and one has stale config → restart the app.

### "F1 Free" doesn't appear in the pricing plan picker
- Try a different region (some new regions launch without F1 first).
- Make sure you're on the **Dev/Test** tab, not Production.
- Make sure Operating System is Linux (F1 on Windows exists too but is sometimes hidden).

### Quota exhausted on F1
F1 gives 60 CPU minutes/day. If your app is constantly hammered, it'll be throttled. The "Quota" blade on App Service shows current usage. Either reduce hits or upgrade to B1 ($13/mo) if it becomes a real product.

### Free SQL DB hit the 100k vCore-seconds limit
The DB stops serving queries until the next month. Solutions: optimize queries, reduce auto-pause delay so it pauses sooner, or upgrade to S0 Standard (~$15/mo).

---

## File reference

- `database/create_database.sql` — local SQL Server (creates DB + table).
- `database/azure_setup.sql` — Azure SQL (table only; DB created via portal).
- `backend/CMS.Api/appsettings.json` — local + placeholder values; **never commit real secrets** here.
- `backend/CMS.Api/Program.cs` — reads `Jwt:Key`, `ConnectionStrings:DefaultConnection`, and `Cors:AllowedOrigins` from any IConfiguration source (env vars take precedence).
- `frontend/src/services/api.ts` — uses `VITE_API_BASE_URL` (empty for local dev → Vite proxy; absolute URL in prod → App Service).
- `.github/workflows/main_*.yml` — auto-created by Azure during App Service setup; edited in Phase 6 to point at `backend/CMS.Api`.
