# NoticeDesk

IRS notice inbox for small tax firms: upload a notice, get the key facts and the deadline in seconds,
and never miss a response window. See [PLAN.md](./PLAN.md) for the full build plan.

## Run locally

**Prerequisites:** Node.js 20+ and a PostgreSQL database (local install, Docker, or a Railway Postgres URL).

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your env file and fill in the values:
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL` — your Postgres connection string
   - `ANTHROPIC_API_KEY` — Claude API key (needed once extraction is built)
   - `AUTH_SECRET` — any long random string (`openssl rand -base64 32`)
   - `UPLOAD_DIR` — where uploads are saved locally, e.g. `./uploads`
3. (Optional) Start Postgres with Docker:
   ```bash
   docker run --name noticedesk-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=noticedesk -p 5432:5432 -d postgres:16
   ```
4. Apply database migrations (once models exist):
   ```bash
   npm run db:migrate
   ```
5. Start the dev server and open http://localhost:3000:
   ```bash
   npm run dev
   ```

## Stack
Next.js (App Router, TypeScript) · Tailwind CSS · PostgreSQL · Prisma · Auth.js · Claude API · Railway
