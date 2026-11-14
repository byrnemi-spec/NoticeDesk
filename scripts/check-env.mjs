// Runs before migrations on every start. Fails fast with a plain-English message
// so a misconfigured deploy (e.g. on Railway) says exactly what to fix.

const problems = [];
const onRailway = Boolean(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID);
const where = onRailway ? "Railway → NoticeDesk service → Variables" : "your .env file";

const dbUrl = (process.env.DATABASE_URL ?? "").trim();
if (!dbUrl) {
  problems.push(
    `DATABASE_URL is missing or empty. Set it in ${where}.` +
      (onRailway
        ? " Value should be ${{Postgres.DATABASE_URL}} — the word before .DATABASE_URL must match your database box's name exactly."
        : ""),
  );
} else if (dbUrl.includes("${{")) {
  problems.push(`DATABASE_URL still contains "\${{" — the Railway reference didn't resolve. Check the database service name in ${where}.`);
} else {
  try {
    const u = new URL(dbUrl);
    if (!u.protocol.startsWith("postgres")) problems.push(`DATABASE_URL must start with postgresql:// (it starts with ${u.protocol}//).`);
    if (onRailway && ["localhost", "127.0.0.1"].includes(u.hostname)) {
      problems.push(`DATABASE_URL points at localhost, which doesn't exist on Railway. Use \${{Postgres.DATABASE_URL}} in ${where}.`);
    }
  } catch {
    problems.push(`DATABASE_URL isn't a valid URL. Re-enter it in ${where}.`);
  }
}

if (!(process.env.AUTH_SECRET ?? "").trim()) {
  problems.push(`AUTH_SECRET is missing. Generate one (openssl rand -base64 32) and add it in ${where}.`);
}

if (problems.length) {
  console.error("\n=== NoticeDesk cannot start: configuration problem ===");
  for (const p of problems) console.error(" - " + p);
  console.error("After fixing, click Deploy (or Redeploy) in Railway.\n");
  process.exit(1);
}
console.log("Config check passed (DATABASE_URL and AUTH_SECRET are set).");
