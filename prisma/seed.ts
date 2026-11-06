// Seed: the 12 notice rules from PLAN.md, one demo firm, one staff user, and 5 fake clients.
// Safe to run more than once (rules and user are upserted; clients are only added once).
// All client data is fake.

import { PrismaClient, Prisma, WindowType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_FIRM_NAME = "Demo Tax Resolution LLC";
const DEMO_EMAIL = "demo@noticedesk.test";
const DEMO_PASSWORD = "demo1234"; // demo only — documented in README

type RuleSeed = {
  code: string;
  aliases: string[];
  name: string;
  description: string;
  windowDays: number | null;
  windowType: WindowType;
  largeBalanceThreshold?: number;
  largeBalanceWindowDays?: number;
  isHard: boolean;
  defaultNextStep: string;
};

// From PLAN.md "Notice rules table". irs_link is left empty until each row is
// checked against the IRS "Understanding your notice" page (see PLAN.md).
const rules: RuleSeed[] = [
  {
    code: "CP3219A",
    aliases: ["Letter 531"],
    name: "Statutory Notice of Deficiency",
    description:
      "90 days to petition Tax Court (150 days if addressed outside the US). Missing it loses the right to go to Tax Court before paying.",
    windowDays: 90,
    windowType: "calendar",
    isHard: true,
    defaultNextStep: "Decide: agree, or file Tax Court petition",
  },
  {
    code: "LT11",
    aliases: ["Letter 1058"],
    name: "Final Notice of Intent to Levy, CDP rights",
    description: "30 days to request a Collection Due Process hearing.",
    windowDays: 30,
    windowType: "calendar",
    isHard: true,
    defaultNextStep: "Request CDP hearing (Form 12153) or resolve",
  },
  {
    code: "CP90",
    aliases: ["CP297"],
    name: "Final Notice of Intent to Levy (federal payments), CDP rights",
    description: "30 days to request a Collection Due Process hearing.",
    windowDays: 30,
    windowType: "calendar",
    isHard: true,
    defaultNextStep: "Request CDP hearing or resolve",
  },
  {
    code: "Letter 3172",
    aliases: [],
    name: "Notice of Federal Tax Lien filing, CDP rights",
    description: "CDP hearing must be requested by the date printed on the letter.",
    windowDays: null,
    windowType: "printed",
    isHard: true,
    defaultNextStep: "Request CDP hearing by printed date",
  },
  {
    code: "CP11",
    aliases: ["CP12"],
    name: "Math error changed the return",
    description: "60 days to request reversal of the math-error adjustment.",
    windowDays: 60,
    windowType: "calendar",
    isHard: true,
    defaultNextStep: "Review the change; dispute in writing if wrong",
  },
  {
    code: "CP2000",
    aliases: [],
    name: "Underreporter: income doesn't match third-party forms",
    description: "30 days to respond; the notice usually prints a respond-by date.",
    windowDays: 30,
    windowType: "calendar",
    isHard: false,
    defaultNextStep: "Compare to return; agree, partially agree, or dispute",
  },
  {
    code: "CP2501",
    aliases: [],
    name: "Initial underreporter inquiry",
    description: "30 days to explain the discrepancy.",
    windowDays: 30,
    windowType: "calendar",
    isHard: false,
    defaultNextStep: "Explain the discrepancy",
  },
  {
    code: "Letter 525",
    aliases: [],
    name: "Proposed exam changes (30-day letter)",
    description: "30 days to agree or request Appeals.",
    windowDays: 30,
    windowType: "calendar",
    isHard: false,
    defaultNextStep: "Agree, or request Appeals",
  },
  {
    code: "CP14",
    aliases: [],
    name: "First balance-due bill",
    description: "21 calendar days to pay (10 business days if the balance is $100,000 or more).",
    windowDays: 21,
    windowType: "calendar",
    largeBalanceThreshold: 100000,
    largeBalanceWindowDays: 10,
    isHard: false,
    defaultNextStep: "Pay, set up payment plan, or dispute; screen for FTA",
  },
  {
    code: "CP501",
    aliases: [],
    name: "First reminder, balance due",
    description: "Pay by the date printed on the notice.",
    windowDays: null,
    windowType: "printed",
    isHard: false,
    defaultNextStep: "Pay or set up payment plan",
  },
  {
    code: "CP503",
    aliases: [],
    name: "Second reminder, balance due",
    description: "Pay by the date printed on the notice. Escalation is next.",
    windowDays: null,
    windowType: "printed",
    isHard: false,
    defaultNextStep: "Pay or plan now; escalation is next",
  },
  {
    code: "CP504",
    aliases: [],
    name: "Notice of Intent to Levy (state refund)",
    description: "Pay by the date printed on the notice, before the final notice.",
    windowDays: null,
    windowType: "printed",
    isHard: false,
    defaultNextStep: "Urgent: pay or plan before final notice",
  },
];

const clients = [
  { name: "Jane Doe", email: "jane.doe@example.com", phone: "555-0101", tinLast4: "4821" },
  { name: "Marcus Bell", email: "marcus.bell@example.com", phone: "555-0102", tinLast4: "1234" },
  { name: "Priya Shah", email: "priya.shah@example.com", phone: "555-0103", tinLast4: "7710" },
  { name: "Okafor Plumbing LLC", email: "office@okaforplumbing.example", phone: "555-0104", tinLast4: "3092" },
  { name: "Elena & Tom Ruiz", email: "ruiz.family@example.com", phone: "555-0105", tinLast4: "5566" },
];

async function main() {
  for (const r of rules) {
    const data = {
      ...r,
      largeBalanceThreshold:
        r.largeBalanceThreshold != null ? new Prisma.Decimal(r.largeBalanceThreshold) : null,
      largeBalanceWindowDays: r.largeBalanceWindowDays ?? null,
    };
    await db.noticeRule.upsert({ where: { code: r.code }, update: data, create: data });
  }

  let firm = await db.firm.findFirst({ where: { name: DEMO_FIRM_NAME } });
  if (!firm) firm = await db.firm.create({ data: { name: DEMO_FIRM_NAME } });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await db.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { firmId: firm.id, passwordHash },
    create: { firmId: firm.id, name: "Demo Staff", email: DEMO_EMAIL, passwordHash, role: "staff" },
  });

  const existingClients = await db.client.count({ where: { firmId: firm.id } });
  if (existingClients === 0) {
    await db.client.createMany({ data: clients.map((c) => ({ ...c, firmId: firm.id })) });
  }

  const [ruleCount, clientCount] = await Promise.all([
    db.noticeRule.count(),
    db.client.count({ where: { firmId: firm.id } }),
  ]);
  console.log(`Seeded: ${ruleCount} notice rules, firm "${firm.name}", user ${DEMO_EMAIL}, ${clientCount} clients.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
