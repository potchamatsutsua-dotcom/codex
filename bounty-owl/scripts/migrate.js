#!/usr/bin/env node
/**
 * Run Supabase migrations via the REST API.
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/migrate.js
 */

const fs = require("fs");
const path = require("path");

async function runMigration(sql) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Migration failed: ${text}`);
  }
}

async function main() {
  const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  console.log(`Found ${files.length} migration file(s)`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");
    console.log(`Running: ${file}`);
    try {
      await runMigration(sql);
      console.log(`  ✓ ${file} completed`);
    } catch (err) {
      console.error(`  ✗ ${file} failed:`, err.message);
      process.exit(1);
    }
  }

  console.log("\nAll migrations complete!");
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
