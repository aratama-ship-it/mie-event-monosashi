/**
 * One-off migration: `facility` (one object) becomes `facilities` (an array).
 *
 * Chain-wide mall campaigns run at several facilities at once — ポケモンしんかラリー
 * is on at all six イオンモール in the prefecture on the same dates. Publishing one
 * card per mall would put six near-identical entries in the listing, so such an
 * event is one record with several venues, which the single `facility` field could
 * not express.
 *
 * Run once, from mock/:  node scripts/migrate-facilities-array.mjs
 * Re-running is safe: already-migrated records are left alone.
 */

import { readFile, writeFile } from "node:fs/promises";

const dataUrl = new URL("../data/events.json", import.meta.url);
const payload = JSON.parse(await readFile(dataUrl, "utf8"));

let migrated = 0;
for (const event of payload.events) {
  if (!event.facility) continue;
  const { facility, ...rest } = event;
  // Rebuild so `facilities` lands where `facility` was, keeping the diff readable.
  const rebuilt = {};
  for (const [key, value] of Object.entries(rest)) {
    rebuilt[key] = value;
  }
  Object.keys(event).forEach((key) => delete event[key]);
  for (const [key, value] of Object.entries(rebuilt)) {
    if (key === "status") event.facilities = [facility];
    event[key] = value;
  }
  if (!event.facilities) event.facilities = [facility];
  migrated += 1;
}

await writeFile(dataUrl, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`migrated ${migrated} record(s) from facility to facilities`);
