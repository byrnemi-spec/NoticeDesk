# CLAUDE.md — NoticeDesk

NoticeDesk is an IRS notice inbox for small tax firms: upload a notice, extract key facts with AI,
compute the response deadline from a rules table, and track it on a dashboard.
**PLAN.md is the source of truth** for scope, screens, data model, and the build prompts (0–10).

## Stack
- **Next.js 15 (App Router) + TypeScript** — frontend and API routes in one app
- **Tailwind CSS v4** — styling (white background, one accent color)
- **PostgreSQL + Prisma 6** — schema in `prisma/schema.prisma`
- **Auth.js (credentials) + bcrypt** — email/password login (Prompt 2)
- **Anthropic TypeScript SDK** — notice extraction; PDFs/images sent directly (Prompt 5)
- **zod** — validate AI JSON output (Prompt 5)
- **Railway** — hosting, Postgres, and a volume at `/data/uploads`; auto-deploys from `main`

## Folder structure
```
PLAN.md                 Build plan (read first)
prisma/schema.prisma    Database schema (Firm, User, Client, Notice, NoticeRule)
prisma/seed.ts          Seeds 12 notice rules, demo firm/user, 5 fake clients
prisma/migrations/      SQL migrations (committed)
src/app/                Pages and API routes (App Router)
src/lib/db.ts           Shared Prisma client
src/lib/                Server logic (extract.ts, deadline.ts, auth helpers — added later)
.env.example            Template for env vars (copy to .env)
uploads/                Local upload dir (gitignored)
```

## Rules (non-negotiable)
1. **Never commit secrets.** `.env` is gitignored. Secrets live in Railway env vars:
   `DATABASE_URL`, `ANTHROPIC_API_KEY`, `AUTH_SECRET`, `UPLOAD_DIR`. Only `.env.example` (no real values) is committed.
2. **Every query is scoped by `firm_id`.** Every page, server action, and API route reads the
   logged-in user's `firmId` and filters by it. Never look up a record by id alone — use
   `where: { id, firmId }`. No cross-firm access.
3. **Store only the last 4 of SSN/EIN** (`tin_last4`). Never store, log, or return a full TIN.
   The AI prompt must request last 4 only, and code must truncate anything longer.
4. Deadlines are computed by code from `NoticeRule` (`src/lib/deadline.ts`), never taken from the AI alone.
5. Uploaded files are served only through an authenticated route — never from `public/`.
6. Use mock / fully redacted notices only. No real client documents.

## Data model notes
- Prisma fields are camelCase; DB columns/tables are snake_case via `@map`/`@@map`.
- `NoticeRule.code` is the primary code (e.g. `CP3219A`); paired codes from PLAN.md live in `aliases`
  (e.g. `Letter 531`). The deadline engine must match on code OR alias.
- CP14's $100K+ rule is stored as `largeBalanceThreshold` + `largeBalanceWindowDays` (business days).
- `Notice.noticeCode` is what the AI read; `Notice.ruleCode` is the matched rule (null = unknown code → manual deadline).
- `NoticeRule` is shared reference data (no firmId); all other tables are firm-scoped.

## Commands
- `npm run dev` — start dev server (http://localhost:3000)
- `npm run build` / `npm start` — production build / run
- `npm run lint` — ESLint
- `npm run db:migrate` — create/apply a Prisma migration
- `npm run db:seed` — load rules + demo data (safe to re-run)
- `npm run db:studio` — browse the database

## Workflow
Build one PLAN.md prompt at a time; test and commit after each.
