import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRef =
  process.env.SUPABASE_PROJECT_REF ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1];
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!projectRef) {
  throw new Error("Set SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL.");
}

if (!accessToken) {
  throw new Error("Set SUPABASE_ACCESS_TOKEN with database write access.");
}

const sqlFiles = [
  "supabase/schema.sql",
  "supabase/operating-system-schema.sql",
  "supabase/phase-1-2-supabase-completion.sql",
  "supabase/document-number-format.sql",
  "supabase/order-payments-ledger.sql",
  "supabase/pick-ticket-line-progress.sql",
  "supabase/demand-reorder-intelligence.sql",
  "supabase/website-production-readiness.sql",
  "supabase/marketing-subscribers.sql",
  "supabase/pricing-tiers.sql",
  "supabase/ar-aging.sql",
  "supabase/design-lab-ratings.sql",
  "supabase/quotes-and-purchase-orders.sql"
];

async function runSql(filePath, query) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${filePath} failed (${response.status}): ${detail}`);
  }

  return response.json().catch(() => ({}));
}

const failures = [];

for (const sqlFile of sqlFiles) {
  const absolutePath = path.resolve(sqlFile);
  const query = await readFile(absolutePath, "utf8");
  process.stdout.write(`Applying ${sqlFile}... `);

  try {
    await runSql(sqlFile, query);
    console.log("ok");
  } catch (error) {
    console.log("FAILED");
    failures.push({ file: sqlFile, message: error.message });
  }
}

if (failures.length) {
  console.log(`\n${failures.length} file(s) reported errors (continuing best-effort):`);
  for (const failure of failures) {
    console.log(`  - ${failure.file}: ${failure.message.replace(/\s+/g, " ").slice(0, 200)}`);
  }
}

console.log(`Supabase schema applied to ${projectRef}.`);
