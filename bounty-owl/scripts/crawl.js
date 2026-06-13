#!/usr/bin/env node
/**
 * Trigger the crawler manually.
 * Usage: CRON_SECRET=... node scripts/crawl.js [--url http://localhost:3000]
 */

const BASE_URL = process.argv.includes("--url")
  ? process.argv[process.argv.indexOf("--url") + 1]
  : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function main() {
  const secret = process.env.CRON_SECRET;
  console.log(`Triggering crawler at ${BASE_URL}/api/crawler`);

  const response = await fetch(`${BASE_URL}/api/crawler`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Crawler failed:", data);
    process.exit(1);
  }

  console.log("Crawler result:", JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
