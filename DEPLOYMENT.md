# Deploying Kalwings (GitHub → Hostinger, automatic)

**Flow:** you merge a pull request into the main branch → GitHub runs CI → Hostinger pulls the new code, builds it and restarts the app.

> What I verified vs. what I couldn't: the build, migrations, health check, production start, email sign-in and admin bootstrap were all run locally against a real **MariaDB** (the engine behind Hostinger's MySQL; email via a mock server). I could **not** log in to Hostinger, GitHub Actions or Resend from here, so the Hostinger menu names and the Actions run itself are unverified. Hostinger moves its menus around; follow the intent, not the exact labels.

## 0. Pick your Hostinger product

| Product | Runs this app? | Notes |
| --- | --- | --- |
| **Node.js Web Apps hosting** (Business/Cloud tiers) | Yes | Built-in GitHub import + auto-deploy, and its **MySQL** databases work with this app. [Hostinger Next.js hosting](https://www.hostinger.com/ph/web-apps-hosting/nextjs-hosting) |
| **VPS** | Yes | You run the database yourself (MariaDB in the included Docker compose). More work, more control. |
| Shared/"Premium" PHP hosting | **No** | No Node runtime. |

This guide is **Option A: Node.js Web Apps + Hostinger MySQL**. Option B (VPS) is at the bottom.

## 1. Services you need

1. **MySQL database** — hPanel → **Databases → MySQL Databases** → create a database, a user and a password. Your connection string is:
   `mysql://USER:PASSWORD@HOST:3306/DBNAME?connection_limit=5`
   - `HOST` is `localhost` when the database and the Node app are on the same Hostinger account; otherwise use the remote host shown in hPanel and allow the app's IP under *Remote MySQL*. (Unverified for your plan — hPanel shows the exact host.)
   - URL-encode special characters in the password (`@`→`%40`, `#`→`%23`, `/`→`%2F`).
   - Hostinger database users usually **can't create databases**. That's fine: production only runs `prisma migrate deploy`, which needs no extra privileges. (Local development uses `migrate dev`, which does — use a local MariaDB/MySQL for that.)
2. **Email for sign-in codes** — [Resend](https://resend.com). Verify your sending domain, create an API key. Without this nobody can log in on production.
3. A **32+ character secret**: `openssl rand -base64 48`

## 2. Get the code into GitHub the way Hostinger likes

The code currently lives in the `kalwings/` **subfolder** of `Sajeed25/github-slideshow` (a Jekyll template repo). Hostinger deploys a repo root most reliably, so export it as its own repo (do this on your laptop):

```bash
git clone https://github.com/Sajeed25/github-slideshow.git
cd github-slideshow
git checkout ccr-9601c933-py5gtg      # (or master, once PR #2 is merged)
git pull
cd kalwings
node scripts/export-standalone-repo.mjs ../../kalwings-site     # Windows: node scripts\export-standalone-repo.mjs ..\..\kalwings-site
```

This works on Windows, macOS and Linux (needs Node 20+ and Git 2.28+). It creates `kalwings-site` next to your clone. On macOS/Linux you can use `./scripts/export-standalone-repo.sh` instead; **on Windows don't** — Command Prompt can't run `.sh` files.

Create an **empty** repo on GitHub named `kalwings` (no README/license), then:

```bash
cd ../../kalwings-site                # Windows: cd ..\..\kalwings-site
git remote add origin https://github.com/Sajeed25/kalwings.git
git push -u origin main
```

Run these inside the **new** `kalwings-site` folder, not inside `github-slideshow` (that clone already has an `origin`, so `git remote add` would fail there). The script fixes the CI/CD paths for the new layout. On the first push GitHub may open a browser window to sign you in. (If you'd rather keep the subfolder, set the *root directory* to `kalwings` in Hostinger, if your plan offers it, and merge to `master` here.)

**Protect the main branch** (GitHub → Settings → Branches): require a pull request and the **CI / verify** check before merging. That makes "merged" mean "builds, lints, typechecks, migrates and boots".

## 3. Create the app in Hostinger

hPanel → **Websites → Add website → Node.js Apps** → **Import Git repository** → authorise GitHub → pick `kalwings` and the `main` branch. Settings:

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Node version | 22 (20 minimum) |
| Build command | `npm run build` |
| Start command | `npm start` (runs `prisma migrate deploy`, then `next start`) |
| Root directory | `/` (or `kalwings` if you skipped the export) |

**Environment variables** (hPanel → the app → Environment variables):

| Name | Value |
| --- | --- |
| `DATABASE_URL` | the MySQL string from step 1 |
| `AUTH_SECRET` | the 32+ char secret |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` (set **before** the build — it's baked in) |
| `EMAIL_API_KEY`, `EMAIL_FROM` | Resend key; a sender on your verified domain |
| `ADMIN_EMAILS` | your email — you become platform admin when you first sign in |
| `CONTACT_TO` | (optional) inbox for contact-form emails; defaults to `EMAIL_FROM` |

Connect your domain and enable SSL, then deploy. Builds need roughly 2 GB RAM.

**Smoke test:** open `https://yourdomain.com/api/health` → `{"ok":true}`. Then sign in at `/login` with your `ADMIN_EMAILS` address, and open `/dashboard`.

If the app refuses to start it names the missing variable (`AUTH_SECRET` / `DATABASE_URL`) in the logs.

## 4. Day-to-day workflow

```
git checkout -b feature/my-change     # on your laptop (or ask Claude to push a branch)
git push -u origin feature/my-change  # open a PR on GitHub
# CI runs → review → Merge → Hostinger auto-deploys main
```

- **Database changes:** edit `prisma/schema.prisma`, then `npx prisma migrate dev --name what_changed` locally and commit the new `prisma/migrations/*` folder. CI fails if you forget. Migrations run automatically on each deploy (`npm start`). Never edit a migration that has already been deployed.
- **Rollback:** revert the PR on GitHub (it auto-deploys), or redeploy the previous commit from hPanel. Migrations don't roll back automatically — write forward-fixing migrations.
- **First admin / more admins:** add emails to `ADMIN_EMAILS`, or run `DATABASE_URL=<prod url> npm run make-admin -- email` from your laptop.
- **Don't seed sample data in production.** `npm run db:seed` is for local development only.

## 5. Connecting on your laptop

```bash
git clone https://github.com/Sajeed25/kalwings.git && cd kalwings
npm install
cp .env.example .env        # set DATABASE_URL (local MariaDB/MySQL) + AUTH_SECRET
npx prisma migrate dev
npm run db:seed             # sample data, local only
npm run dev                 # http://localhost:3000  — sign-in codes show on screen in dev
```

Requires Node 20+ and MySQL 8 / MariaDB 10.6+. Quick local database: `docker run -d -p 3306:3306 -e MARIADB_ROOT_PASSWORD=root -e MARIADB_DATABASE=kalwings mariadb:10.11`, then `DATABASE_URL=mysql://root:root@localhost:3306/kalwings`. Optional: `npm run test:e2e` with the dev server running.

## 6. Option B — Hostinger VPS (Docker, auto-deploy via GitHub Actions)

1. On the VPS: install Docker, `git clone` the repo to e.g. `/srv/kalwings`, create `/srv/kalwings/.env` with `DB_PASSWORD`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `EMAIL_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAILS`, and run `docker compose up -d --build`. Put Caddy or nginx in front for HTTPS → `localhost:3000`.
2. GitHub → Settings → Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (a deploy key), `VPS_APP_DIR`; Variables: `DEPLOY_VPS=true`. Then every merge to the main branch runs `.github/workflows/deploy-vps.yml`.
3. Back up the `dbdata` volume (`docker compose exec db mariadb-dump -uroot -p"$DB_PASSWORD" kalwings > backup.sql`).

The Dockerfile, compose file and deploy workflow are **untested** (no Docker in my environment).

## 7. Before you announce the site

- [ ] Real email delivery works (sign up with a second address).
- [ ] `/api/health` is OK; set an uptime monitor on it.
- [ ] No sample users: `npm run db:unseed` against production if you ever ran the seed there.
- [ ] Mobile sign-in is **not available in production** (no SMS provider) — the form says so.
- [ ] Replace placeholders (README → "Where to replace placeholders"); lawyer-review Privacy/Terms.
- [ ] Schedule database backups (hPanel has backup tools for MySQL, or `mariadb-dump` on a cron).
