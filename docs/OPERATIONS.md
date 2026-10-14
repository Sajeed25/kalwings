# Operations runbook

## Environments and configuration
| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | `mysql://user:pass@host:3306/db?connection_limit=5` (URL-encode special characters) |
| `AUTH_SECRET` | yes | 32+ random characters; changing it signs everyone out |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://app.kalwings.com`; baked in at build time, so redeploy after changing |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` | yes in production | Hostinger mailbox over SMTP (`smtp.hostinger.com`, 465); without it nobody can log in |
| `ADMIN_EMAILS` | first admin | Comma-separated; these emails become platform admins when they sign in |
| `CONTACT_TO` | no | Inbox for contact-form emails |
| `SANDBOX_URL`, `SANDBOX_TOKEN` | no | Isolated Judge0-compatible runner; unset = coding assessments off |
| `GOOGLE_CLIENT_ID/SECRET` | no | Google sign-in |
| `AUTO_MIGRATE` | no | Defaults to on: when the server starts it applies any pending database migrations itself (the SQL is embedded in the build, so it needs no Prisma CLI or `prisma/` folder, which Hostinger doesn't deploy). It records them in Prisma's `_prisma_migrations` table, so `prisma migrate status` still agrees. Set `false` to turn it off. Look for `[migrate] ok` or `[migrate] FAILED` in the runtime log. |

## Deploy and rollback
Migrations run automatically on every start (see `AUTO_MIGRATE`). After adding a migration under `prisma/migrations`, `npm run build` regenerates `src/lib/migrations.generated.ts`; commit it (CI fails if it is stale).
Merge a PR into `main`; GitHub CI runs; Hostinger pulls, builds (`npm run build`) and starts (`npm start`, which runs `prisma migrate deploy` first). Rollback: revert the PR on GitHub (auto-deploys) or redeploy the previous commit from hPanel. **Migrations are forward-only** and additive: never edit a deployed migration; fix forward with a new one. Merge stacked PRs bottom-up.

## Health and monitoring
- `GET /api/health` returns `{"ok":true}`; on failure it returns a safe category (`unreachable`, `auth_failed`, `unknown_database`, `bad_database_url`, `prisma_engine`, `too_many_connections`). Point an uptime monitor at it (UptimeRobot/BetterStack, 1-minute check, alert by email/SMS).
- Startup writes `[startup]` lines to the runtime log with the database host, user and password length (never the password) and the site URL.
- Unhandled server errors are stored and listed at Dashboard → Server errors (admin).
- Optional: add Sentry via `SENTRY_DSN` (not wired).

## Backups and recovery
- **Backup**: `DATABASE_URL=... npm run backup -- ./backups 14` writes a gzip dump and keeps the newest 14 (needs `mysqldump` or `mariadb-dump`; the password is passed via `MYSQL_PWD`, not the command line). Schedule it daily (cron on a VPS, or a scheduled GitHub Action/hPanel cron) and copy the files **off the server** (object storage or another machine). Also enable Hostinger's own database backups.
- **Restore** (to a new, empty database first, then switch `DATABASE_URL`): `gunzip -c backups/<file>.sql.gz | mysql -h HOST -u USER -p DBNAME`, then `npx prisma migrate status` should report the schema is up to date. Test a restore at least once before launch and then quarterly.
- **Targets (proposed)**: lose at most 24 hours of data (daily backup); restore within 2 hours.
- Uploaded images live in the database, so they are covered by the same backups.

## Routine tasks
- **First/extra admin**: add the email to `ADMIN_EMAILS` and sign in, or `DATABASE_URL=... npm run make-admin -- email`.
- **Never run `npm run db:seed` in production**. If it ever ran there, run `npm run db:unseed`.
- **Rotate secrets** (every 6 to 12 months or after any exposure): generate a new `AUTH_SECRET` (`openssl rand -base64 48`), new mailbox password, new DB password; update env vars in hPanel; redeploy.
- **Suspend an abusive user**: Dashboard → Users. **Hide content / archive a group**: Dashboard → Reports or the group page.
- **Assign an employer plan**: Dashboard → Employer plans.
- **Refresh generated docs** after schema or action changes: `npm run docs:db && npm run docs:api`.

## Incident checklist
1. Check `/api/health` and the runtime log. 2. If the database is unreachable the public site still serves pages; sign-in and dashboards show a friendly error. 3. Check recent deploys; roll back if the failure began with one. 4. Check Dashboard → Server errors. 5. For a suspected data exposure: suspend affected accounts, rotate secrets, preserve logs, notify affected users as required by law. 6. Write down what happened and add a test.

## Data retention (proposed policy; adjust with legal advice)
- Active accounts: kept until the user deletes the account (self-service; removes profile, applications, messages, uploads, submissions, posts) or an admin does.
- OTP codes expire in 10 minutes; rate-limit rows and error logs are small and can be deleted after 30 days (`DELETE FROM RateLimit WHERE resetAt < NOW()`; `DELETE FROM ErrorLog WHERE createdAt < NOW() - INTERVAL 30 DAY`). **Not scheduled yet.**
- Audit log: keep at least 12 months.
- Backups: 14 daily copies; delete older copies, which also bounds how long deleted data persists in backups.

## Quality gates before each release
`npm run lint && npm run typecheck && npm run test:unit && npm run build`, then with a seeded dev DB: `npm run test:e2e`, `npm run test:access`, `npm run test:a11y`; with a production build: `npm run test:e2e:prod`.
