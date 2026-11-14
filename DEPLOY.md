# Deploying NoticeDesk to Railway

First-time, click-by-click. Takes about 15 minutes. Railway's UI changes now and then, so a
button may be worded slightly differently — look for the closest match.

## How this app deploys (so the steps make sense)

- Railway pulls the code from GitHub `main` and, because the repo has a `Dockerfile`, builds the
  app with it (Build Logs show Docker steps). It then runs `npm start`.
- `npm start` does four things in order, every time the app starts:
  0. Checks `DATABASE_URL` and `AUTH_SECRET` are set. If not, the Deploy Logs print
     **"NoticeDesk cannot start: configuration problem"** with exactly what to fix.
  1. `prisma migrate deploy` — creates/updates the database tables
  2. `prisma db seed` — loads the 12 notice rules, demo firm, demo user, and 5 fake clients
     (safe to repeat: it never duplicates rows, and resets the demo password to `demo1234`)
  3. `next start` — starts the website
- So you never run the migration or seed by hand. They happen on every deploy.

Variables the app needs **now**: `DATABASE_URL`, `AUTH_SECRET`.
Added **later**: `ANTHROPIC_API_KEY` (Prompt 5) and `UPLOAD_DIR` + a volume at `/data/uploads` (Prompt 4).

---

## Step 1 — Create a Railway account
1. Go to **railway.com** → **Login** → **Continue with GitHub**, and sign in as the GitHub account that owns `byrnemi-spec/NoticeDesk`.
2. Accept the terms. If asked to pick a plan, use the trial (or your course's plan).

✅ **Check:** you land on your Railway dashboard.

## Step 2 — Create the project from GitHub
1. Click **New Project** (or **+ New**) → **Deploy from GitHub repo**.
2. If NoticeDesk isn't listed, click **Configure GitHub App** → choose your account → under
   *Repository access* pick **Only select repositories** → select **NoticeDesk** → **Save**. Return to Railway.
3. Click **byrnemi-spec/NoticeDesk**. If asked, choose **Deploy Now** (not "Add variables").

✅ **Check:** a project canvas opens with a box called **NoticeDesk** and a build starts.
⚠️ **Expected:** this first deploy **fails or crashes** — there's no database yet. That's fine.

## Step 3 — Add PostgreSQL
1. On the project canvas, click **+ Create** (or **+ New**, top right) → **Database** → **Add PostgreSQL**.
2. Wait about 30 seconds.

✅ **Check:** a second box called **Postgres** appears with a green dot / "Active".
Click it → **Variables** tab: you should see `DATABASE_URL` (and `DATABASE_PUBLIC_URL`). Don't copy it — you'll reference it instead.

## Step 4 — Generate a production AUTH_SECRET
This is a long random password used to sign logins. Make a **new** one; don't reuse the local one.

- **Mac / Linux** — open Terminal and run:
  ```bash
  openssl rand -base64 32
  ```
- **Windows** — open PowerShell and run:
  ```powershell
  $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
  ```

Copy the output (about 44 characters, e.g. `q3W...=`). Don't paste it anywhere except Railway.

## Step 5 — Set the app's variables
1. Click the **NoticeDesk** box → **Variables** tab.
2. Click **+ New Variable**:
   - Name: `DATABASE_URL`
   - Value: `${{Postgres.DATABASE_URL}}` (type it exactly — Railway autocompletes after `${{`)
   - Click **Add**.
   This is a *reference*: it always points at your Postgres service's private address.
3. **+ New Variable** again:
   - Name: `AUTH_SECRET`
   - Value: the string from Step 4
   - **Add**.
4. A banner appears ("Apply N changes" / **Deploy**). Click **Deploy** to apply.

✅ **Check:** the Variables tab lists `DATABASE_URL` (shown as a reference to Postgres) and `AUTH_SECRET` (hidden). A new deployment starts.

## Step 6 — Watch the deploy (this is where migration + seed happen)
1. Click **NoticeDesk** → **Deployments** tab → click the newest deployment → **View logs**.
2. **Build Logs** — wait for the end. Look for:
   - `Generated Prisma Client`
   - `✓ Compiled successfully`
3. **Deploy Logs** — look for these lines, in this order:
   - `Config check passed (DATABASE_URL and AUTH_SECRET are set).`
   - `All migrations have been successfully applied.` ← migration ran
   - `Seeded: 12 notice rules, firm "Demo Tax Resolution LLC", user demo@noticedesk.test, 5 clients.` ← seed ran
   - `✓ Ready in …` ← website is up. Note the port in `Local: http://localhost:XXXX` (usually 8080).

✅ **Check:** the deployment shows **Active / Success** (green).

## Step 7 — Get a public URL
1. **NoticeDesk** → **Settings** tab → **Networking** section → **Generate Domain**.
2. If it asks for a port, enter the port from the `Local:` log line (usually `8080`).

✅ **Check:** you get a URL like `noticedesk-production-xxxx.up.railway.app`.

## Step 8 — Log in
1. Open the URL. You should be sent to the **login page**.
2. Sign in: **demo@noticedesk.test** / **demo1234**.

✅ **Check:** you see the Dashboard with the sidebar, "Demo Tax Resolution LLC" under the logo, and "Demo Staff" at the bottom. Click Clients and Upload; click Sign out.

## Step 9 — Confirm the data is in the Railway database
1. Click the **Postgres** box → **Data** tab.

✅ **Check:** tables `firms`, `users`, `clients`, `notices`, `notice_rules`, `_prisma_migrations`.
`notice_rules` has **12** rows, `clients` has **5**, `users` has **1**, `notices` has 0.

## Step 10 — Auto-deploy check
**NoticeDesk** → **Settings** → **Source**: the repo is `byrnemi-spec/NoticeDesk` and branch is **main**.
From now on, every push to `main` redeploys automatically.

---

## If something goes wrong

| What you see (Deploy Logs) | Cause | Fix |
| --- | --- | --- |
| `NoticeDesk cannot start: configuration problem` | A variable is missing or wrong | Do what the lines under it say, then click Deploy |
| `Environment variable not found: DATABASE_URL` | Variable missing or misspelled | Step 5; value must be exactly `${{Postgres.DATABASE_URL}}` |
| `Can't reach database server` / `P1001` | Reference points at the wrong service name | If your database box isn't named "Postgres", use its name: `${{YourName.DATABASE_URL}}` |
| `MissingSecret` | `AUTH_SECRET` not set | Step 4–5 |
| Browser says "Application failed to respond" | Domain port doesn't match the app | Settings → Networking → edit the domain's port to match the `Local:` port in the logs |
| Login says "Invalid email or password" | Seed didn't run | Check Deploy Logs for the `Seeded:` line; redeploy |
| Build fails | Code issue | Copy the red error lines and share them |

## Notes
- The demo login is public to anyone with the URL. Use **fake data only** (PLAN.md rule).
- Never put secrets in the code or commit them — only in Railway Variables.
