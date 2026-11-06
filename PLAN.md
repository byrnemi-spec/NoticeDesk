# NoticeDesk — MVP Build Plan

Nov 6, 2026 · @mike

## What we're building

**NoticeDesk is an IRS notice inbox for small tax firms: upload a notice, get the key facts and the deadline in seconds, and never miss a response window.**

**The problem.** Small tax and tax-resolution firms receive IRS notices every day, by mail and forwarded from clients. Each one has to be read, understood, matched to a client, and calendared. Clients often sit on a notice for weeks before sending it, which burns the response window. Missing certain deadlines (for example, 30 days on a Final Notice of Intent to Levy) costs the client rights that can't be recovered.

**Who it's for.** Firms of 1 to 25 people that handle IRS notices and representation but don't pay for enterprise research suites like CCH.

**The pitch thesis.** Summarizing a notice is easy; *managing* dozens of them across clients is the real job. NoticeDesk is built around the deadline, not the summary: the AI reads, a rules table sets the deadline, and the professional confirms.

**Origin story for the pitch.** Michael worked at a Bethesda tax law firm in summer 2026 and saw notices arriving constantly, from the mail and from clients.

## Scope: in, stretch, out

The MVP is the firm-side inbox plus deadline dashboard; client upload links are the first stretch goal, built only once the core works end to end.

| Feature | Tier | Why |
| --- | --- | --- |
| Firm login (one firm, a few staff accounts) | MVP | Needed to show it's a real product |
| Client list with a folder per client | MVP | Core organization ask |
| Upload notice (PDF or phone photo) into a client folder | MVP | The core action |
| AI extraction of key fields + plain-English summary | MVP | The "wow" moment |
| Deadline calculated from the rules table, staff confirms | MVP | The real value; protects accuracy |
| Upcoming Deadlines dashboard, color-coded by urgency | MVP | The money screen in the demo |
| Notice status (New → Reviewed → Responded → Closed) | MVP | Turns a summary into a workflow |
| Per-client upload link (no client login) | Stretch 1 | Solves clients sitting on notices |
| First-time penalty abatement (FTA) screening flag | Stretch 2 | Shows tax depth; cheap to add as a yes/no checklist |
| Draft client email explaining the notice | Stretch 3 | Easy AI add-on, nice in demo |
| Email/text deadline reminders | Out | Needs email service setup; mention as roadmap |
| Client accounts and client-facing analysis | Out | Doubles scope; liability if clients act on AI output alone |
| Drafting formal responses to the IRS | Out | Accuracy and liability risk; roadmap only |
| State tax notices | Out | Roadmap; IRS only for MVP |
| Billing, multiple firms, integrations | Out | Not needed to demo |

## User flow

Staff (and later, clients via a link) upload a notice; the AI reads it, the rules table sets the deadline, and staff confirm before it counts on the dashboard.

&#91;embedded content: notice flow · 2 ways in, 1 dashboard\]

Clients never see the AI analysis; they only get a confirmation that their firm received the notice.

## Screens

Six screens cover the MVP; the Dashboard is the one the demo opens on and returns to.

1. **Login.** Email and password. One demo firm pre-loaded.
2. **Dashboard (home).** Top: counts of Overdue, Due in 7 days, Due in 30 days, New/unreviewed. Main: a table of all open notices sorted by deadline — client, notice code, tax year, amount, deadline, days left, status. Rows colored red (overdue or ≤7 days), amber (8–21 days), green (22+). Big "Upload notice" button.
3. **Clients.** List of clients with search, count of open notices, and nearest deadline. "Add client" button (name, email, phone, last 4 of SSN/EIN only).
4. **Client folder.** Client info at top. Every notice for that client, newest first, with status. Upload button pre-set to this client. (Stretch: "Copy upload link" button.)
5. **Upload.** Pick a client, drag in a PDF or image, submit. Shows a progress state ("Reading notice…") then jumps to the notice detail.
6. **Notice detail.** Left: the original document viewer. Right: extracted fields in an editable card, the plain-English summary, "What the IRS wants," "What happens if ignored," suggested next step, the calculated deadline with a "Confirm deadline" button, status dropdown, and an internal notes box. A yellow banner shows until a staff member confirms the extraction.

*Stretch screen:* **Client upload page** (public, via unique link). Firm name, "Upload your IRS notice," a big photo/file button, and a confirmation: "Got it — \[Firm\] has your notice." No analysis shown to the client.

## Extraction: what the AI pulls and how

The AI reads the notice and returns structured fields; the deadline is then computed by code from the notice code and notice date, never taken from the AI alone.

**How it works**

1. File is uploaded and stored.
2. The file (PDF or image) is sent to the Claude API with a fixed prompt asking for JSON only, matching the schema below.
3. Code validates the JSON (required fields present, dates parse, amount is a number).
4. Code looks up the notice code in the rules table and computes: deadline = notice date + response window. If the notice prints its own "respond by" date, store both and flag any mismatch.
5. Notice is saved with status New and `needs_review = true`. Staff confirm or correct, which flips it to Reviewed.

**Fields extracted**

| Field | Example | Notes |
| --- | --- | --- |
| notice\_code | CP2000 | Top or bottom right corner of the notice |
| notice\_date | 2026-10-14 | Date printed on the notice |
| tax\_year | 2024 | Can be more than one; store a list |
| tax\_form | 1040 | 1040, 941, 1120, etc. |
| amount\_due | 3,412.00 | Null if none |
| printed\_respond\_by | 2026-11-13 | If the notice states one |
| taxpayer\_name | Jane Doe | Used to confirm the right client folder |
| tin\_last4 | 4821 | Store last 4 only; never the full SSN |
| issue\_summary | "IRS found $9,800 of 1099-NEC income not on the return." | 1–2 sentences, plain English |
| what\_irs\_wants | "Agree and pay, or send a response disagreeing." |  |
| if\_ignored | "IRS will assess the tax and send a bill; interest grows." |  |
| penalties\_listed | Failure-to-pay, accuracy-related | Feeds FTA screening stretch |
| confidence | high / medium / low | AI's self-rating; low forces review |

**Fallback:** if the notice code isn't in the rules table, mark it "Unknown type — set deadline manually" and push it to the top of the dashboard.

## Notice rules table

Start with these 12 notice codes; they cover the bulk of what a small firm sees, and the code becomes a `notice_rules` table the app reads.

**Rule for the code:** if the notice prints its own respond-by date, that date wins and is shown. Otherwise use notice date + window below. Rows marked **hard** are statutory deadlines where missing it loses rights — show them with a red "Hard deadline" badge regardless of days left.

| Code | What it is | Window from notice date | Hard? | Default next step |
| --- | --- | --- | --- | --- |
| CP3219A / Letter 531 | Statutory Notice of Deficiency | 90 days (150 if addressed outside US) to petition Tax Court | Hard | Decide: agree, or file Tax Court petition |
| LT11 / Letter 1058 | Final Notice of Intent to Levy, CDP rights | 30 days to request CDP hearing | Hard | Request CDP hearing (Form 12153) or resolve |
| CP90 / CP297 | Final Notice of Intent to Levy (federal payments), CDP rights | 30 days | Hard | Request CDP hearing or resolve |
| Letter 3172 | Notice of Federal Tax Lien filing, CDP rights | Date printed on letter | Hard | Request CDP hearing by printed date |
| CP11 / CP12 | Math error changed the return | 60 days to request reversal | Hard | Review the change; dispute in writing if wrong |
| CP2000 | Underreporter: income doesn't match third-party forms | 30 days (respond-by printed) | No | Compare to return; agree, partially agree, or dispute |
| CP2501 | Initial underreporter inquiry | 30 days | No | Explain the discrepancy |
| Letter 525 | Proposed exam changes (30-day letter) | 30 days | No | Agree, or request Appeals |
| CP14 | First balance-due bill | 21 days (10 business days if $100K+) | No | Pay, set up payment plan, or dispute; screen for FTA |
| CP501 | First reminder, balance due | Date printed | No | Pay or set up payment plan |
| CP503 | Second reminder, balance due | Date printed | No | Pay or plan now; escalation is next |
| CP504 | Notice of Intent to Levy (state refund) | Date printed | No | Urgent: pay or plan before final notice |

**Before the demo:** check each row against the IRS "Understanding your notice" page for that code and add a link column. The collection sequence these reflect is CP14 → CP501 → CP503 → CP504 → LT11/Letter 1058 ([source](https://morkelfinancial.com/blog/irs-cp14-notice-what-to-do)); CP14's 21-day window and the 10-business-day rule for $100K+ balances are noted in practitioner guides ([source](https://kdainc.com/?p=45479)).

## Tech stack

One Next.js app plus one Postgres database, both on Railway, with the Claude API doing extraction — the fewest moving parts that still look like a real product.

| Layer | Choice | Why |
| --- | --- | --- |
| App framework | Next.js (App Router) + TypeScript | Frontend and backend in one project; Claude Code is strong with it |
| Styling | Tailwind CSS | Fast, clean UI without design work |
| Database | PostgreSQL on Railway | One click to add in Railway |
| Database access | Prisma | Schema in one file, easy migrations |
| Login | Simple email + password (Auth.js credentials) | No Google/OAuth setup needed |
| File storage | Railway volume mounted at `/data/uploads` | No extra service; fine for a demo |
| AI | Claude API via the Anthropic TypeScript SDK; PDFs and images sent directly | Reads scanned notices without separate OCR |
| Hosting | Railway, auto-deploy from GitHub `main` | Course tool; push = deploy |
| Code | GitHub repo, Claude Code for building | Course tools |

**Environment variables (set in Railway, never in code):** `DATABASE_URL`, `ANTHROPIC_API_KEY`, `AUTH_SECRET`, `UPLOAD_DIR`.

**How a request flows:** browser uploads file → Next.js API route saves it to the volume → sends it to Claude with the extraction prompt → validates JSON → applies the rules table → saves the notice row → returns the notice ID → browser opens Notice detail.

## Data model

Five tables: a firm has users and clients, a client has notices, and every notice points to a rule.

**Firm** — id, name, created\_at

**User** — id, firm\_id, name, email, password\_hash, role (`admin` / `staff`)

**Client** — id, firm\_id, name, email, phone, tin\_last4, upload\_token (stretch: random string for the public upload link), created\_at

**Notice**

| Field | Type | Notes |
| --- | --- | --- |
| id, firm\_id, client\_id | ids |  |
| file\_path, file\_type | text | Where the upload lives on the volume |
| uploaded\_by | text | `staff` or `client_link` |
| notice\_code, tax\_form | text |  |
| tax\_years | int list |  |
| notice\_date, printed\_respond\_by | date |  |
| deadline | date | The one the dashboard uses |
| deadline\_source | text | `printed`, `rule`, or `manual` |
| is\_hard\_deadline | boolean | From the rule |
| amount\_due | decimal |  |
| summary, what\_irs\_wants, if\_ignored, next\_step | text |  |
| penalties\_listed | text list |  |
| confidence | text | high / medium / low |
| raw\_ai\_json | json | Keep for debugging |
| needs\_review | boolean | True until staff confirm |
| status | text | New / Reviewed / Responded / Closed |
| notes | text | Internal |
| reviewed\_by, reviewed\_at, created\_at |  |  |

**NoticeRule** — code (primary key), name, description, window\_days, window\_type (`calendar` / `business` / `printed`), is\_hard, default\_next\_step, irs\_link. Seeded from the rules table above.

## Security and privacy

The MVP uses only fake notices, and the pitch shows a one-slide plan for real client data — firms will ask about this first.

**For the MVP (do these):**

- [ ] Use only mock or fully redacted notices. No real client documents, ever.
- [ ] Store only the last 4 digits of SSN/EIN; tell the AI prompt to return last 4 only.
- [ ] Every page and API route checks the logged-in user's firm\_id; no cross-firm access.
- [ ] Passwords hashed (bcrypt). Secrets in Railway env vars, `.env` in `.gitignore`.
- [ ] Uploaded files served only through a logged-in route, never a public URL.
- [ ] Client upload link (stretch): long random token, upload-only, shows nothing back.

**For the pitch (say these, don't build them):**

- Tax preparers must protect client data under IRC §7216 and keep a written information security plan under the FTC Safeguards Rule. NoticeDesk is designed to fit inside that plan.
- Production version: encryption at rest, S3-style private storage, audit log of who viewed each notice, MFA, AI provider under a zero-retention / no-training agreement, SOC 2 roadmap.

## Build schedule

The core app (Prompts 0–9) is live on Railway by Saturday Nov 14; the last week is for the stretch goal, real feedback, and the pitch.

&#91;embedded content: build schedule · Nov 6 to Nov 20\]

If anything slips, cut the stretch goal first, never the dashboard or the deadline engine. Demo-ready means: login, upload, extraction, confirmed deadline, dashboard, deployed.

## Claude Code prompts, in order

Paste these one at a time; test and commit after each before moving on. Save this whole doc as `PLAN.md` in the repo root first so every prompt can point to it.

**Prompt 0 — Setup**

```
Read PLAN.md. Create a Next.js (App Router, TypeScript) app with Tailwind and Prisma using PostgreSQL. Add a CLAUDE.md summarizing the stack, folder structure, and rules: never commit secrets, every query is scoped by firm_id, store only last 4 of SSN/EIN. Set up .gitignore and a README with local run steps. Don't build features yet.
```

**Prompt 1 — Database**

```
Using the Data model section of PLAN.md, write the Prisma schema for Firm, User, Client, Notice, NoticeRule. Create a seed script that loads the 12 rows from the Notice rules table section into NoticeRule, plus one demo firm, one staff user (demo@noticedesk.test), and 5 fake clients. Run the migration and seed.
```

**Prompt 2 — Login and layout**

```
Add email/password login with Auth.js credentials and bcrypt. Protect every page except /login. Build an app shell with a left sidebar: Dashboard, Clients, Upload. Clean, professional style, white background, one accent color.
```

**Prompt 3 — Clients**

```
Build the Clients list page and Client folder page as described in the Screens section of PLAN.md. Include Add client. All queries filtered by the logged-in user's firm_id.
```

**Prompt 4 — Upload and storage**

```
Build the Upload page: pick a client, upload a PDF, JPG, or PNG (max 10 MB). Save the file to UPLOAD_DIR with a random filename and create a Notice row with status New. Serve files only through an authenticated route. No AI yet; redirect to a placeholder Notice detail page.
```

**Prompt 5 — AI extraction**

```
Add lib/extract.ts. Send the uploaded file to the Claude API (Anthropic TypeScript SDK, PDF as a document block, images as image blocks) with a prompt that returns ONLY JSON matching the Fields extracted table in PLAN.md. Validate with zod. Return only the last 4 digits of any SSN/EIN. On failure, save the notice with confidence low and needs_review true. Store the raw JSON.
```

**Prompt 6 — Deadline engine**

```
Add lib/deadline.ts. Given notice_code, notice_date, and printed_respond_by, look up NoticeRule and compute deadline, deadline_source, and is_hard_deadline per the 'Rule for the code' paragraph in PLAN.md. Handle business days (skip weekends). Unknown codes: deadline null, flag for manual entry. Write unit tests covering CP14, CP2000, LT11, CP3219A, and an unknown code.
```

**Prompt 7 — Notice detail**

```
Build the Notice detail page per PLAN.md: document viewer on the left; editable extracted fields, summary, what the IRS wants, if ignored, next step, deadline with a Confirm button, status dropdown, and notes on the right. Show a yellow 'Needs review' banner until confirmed. Show a red 'Hard deadline' badge when is_hard_deadline.
```

**Prompt 8 — Dashboard**

```
Build the Dashboard per PLAN.md: four count cards (Overdue, Due in 7 days, Due in 30 days, Needs review), then a table of open notices sorted by deadline with red/amber/green rows. Clicking a row opens the notice.
```

**Prompt 9 — Deploy**

```
Prepare for Railway: production build, Prisma migrate on deploy, a volume mounted at /data/uploads, and a list of env vars I need to set. Walk me through each Railway click.
```

**Prompt 10 (stretch) — Client upload link**

```
Add a per-client upload_token and a 'Copy upload link' button on the Client folder. Build a public /u/[token] page: firm name, upload button that accepts phone photos, and a thank-you message. It creates a Notice with uploaded_by client_link and runs the same extraction. It must show no analysis to the client and reject invalid tokens.
```

## Demo, test data and pitch

The demo is three minutes: a full dashboard, one live upload, and the deadline that would have been missed.

**Test data (build by Nov 13).** Make 6–8 mock notices as PDFs in Word or Google Docs, copying the layout of the IRS sample notice images (notice code top right, notice date, tax year, amount, respond-by). Use fake names and SSNs like XXX-XX-1234. Cover: CP2000, CP14, CP504, LT11, CP3219A, CP12, and one unknown code. Take a phone photo of one printed notice to show image upload. Pre-load 5 clients with about 12 notices so the dashboard looks lived-in.

**Demo script**

1. Open on the Dashboard: "This is a firm's Monday morning." Point to 1 overdue and 2 hard deadlines in red.
2. Upload a fresh LT11 for a client. Show "Reading notice…" then the detail page.
3. Walk the right panel: plain-English summary, red "Hard deadline — 30 days to request a hearing," next step.
4. Click Confirm. Back to Dashboard: it's now sorted near the top.
5. Open a client folder: every notice for that client in one place.
6. (Stretch) Copy the client upload link, open it on your phone, snap a notice, refresh the dashboard.

**Pitch outline (aim for 5–7 slides)**

1. **Problem** — what you saw at the firm this summer; notices pile up and clients sit on them.
2. **Why it matters** — some deadlines are statutory; miss a 30-day CDP window and the client loses hearing rights.
3. **Solution** — NoticeDesk: upload, understand, calendar, track.
4. **Demo** — live.
5. **Why us / why now** — accounting student with firm experience; enterprise tools like CCH exist but target firms that pay for big research suites.
6. **Business model** — monthly subscription per firm, priced by seat or notice volume. Starting hypothesis to test with 3 firms: a low per-seat price for solo/small firms. Validate by asking your former firm what they'd pay.
7. **Roadmap and trust** — security plan, client upload links, reminders, state notices, response drafting.

**Validation to mention:** before Nov 20, show the prototype to someone at your summer firm and quote their reaction on the Problem slide.

## Open decisions

These are defaulted in this plan; change any of them before running Prompt 0.

- [ ] **Name:** "NoticeDesk" is a placeholder. Keep or rename?
- [ ] **Existing code:** if the October MVP draft already exists, reuse its repo and start at the first prompt it doesn't cover, rather than starting over.
- [ ] **Client upload link:** stretch goal (as planned) or must-have for the pitch?
- [ ] **Hosting a database:** confirm the course's Railway plan allows a Postgres service and a volume.
- [ ] **Claude API key:** do you have one with credits, or does the course provide it?
- [ ] **Pricing:** pick one number for the pitch after talking to your former firm.
