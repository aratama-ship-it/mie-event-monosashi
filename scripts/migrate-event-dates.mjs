/**
 * One-off migration: make structured dates the source of truth.
 *
 * Before this migration, the only machine-readable date was `isoDate` (the first
 * day). Multi-day and recurring events encoded their real dates inside the
 * *display* strings `month` ("7–8") and `day` ("27・3・17・24・31"), and
 * `lib/event-dates.mjs` reverse-engineered occurrences from them — inferring a
 * month rollover whenever the next number was smaller than the previous one.
 *
 * After this migration each record carries:
 *   startDate      first day (ISO)
 *   endDate        last day (ISO)
 *   dates          explicit occurrence list, only for non-contiguous series
 *   closedWeekdays optional [0-6], derived from notes like "月曜休館"
 *   dateNote       renamed from `weekday`, because it also held editorial text
 *                  such as "月曜休館" / "会期中無休" / "期間中"
 *
 * `month` / `day` are removed: they are now derived for display by
 * `formatEventDate()`. `period` is removed: the seasonal buckets
 * ("weekend" = 7月末まで / "august" / "september") were hardcoded into every
 * record and could not survive September.
 *
 * Run once, from mock/:  node scripts/migrate-event-dates.mjs
 * Re-running is safe: already-migrated records are left untouched.
 */

import { readFile, writeFile } from "node:fs/promises";

const dataUrl = new URL("../data/events.json", import.meta.url);

/** The pre-migration occurrence logic, kept here so we can prove equivalence. */
function legacyOccursOn(event, targetDate) {
  const isoFromParts = (year, month, day) =>
    new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);

  if (event.day.includes("・")) {
    const [year, startMonth] = event.isoDate.split("-").map(Number);
    const monthParts = event.month.split("–").map(Number);
    const finalMonth = monthParts.at(-1) ?? startMonth;
    let currentMonth = startMonth;
    let previousDay = 0;

    return event.day.split("・").some((part) => {
      const day = Number(part);
      if (previousDay && day < previousDay && currentMonth < finalMonth) {
        currentMonth += 1;
      }
      previousDay = day;
      return isoFromParts(year, currentMonth, day) === targetDate;
    });
  }

  if (event.day.includes("–")) {
    const [year, startMonth] = event.isoDate.split("-").map(Number);
    const [startDay, endDay] = event.day.split("–").map(Number);
    const monthParts = event.month.split("–").map(Number);
    let endMonth = monthParts.at(-1) ?? startMonth;
    let endYear = year;

    if (monthParts.length === 1 && endDay < startDay) {
      endMonth += 1;
      if (endMonth > 12) {
        endMonth = 1;
        endYear += 1;
      }
    }

    const endDate = isoFromParts(endYear, endMonth, endDay);
    return targetDate >= event.isoDate && targetDate <= endDate;
  }

  return event.isoDate === targetDate;
}

const addDays = (isoDate, amount) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

/** Every date the legacy logic considers an occurrence, scanned generously. */
function legacyOccurrences(event) {
  const found = [];
  for (let offset = -1; offset <= 400; offset += 1) {
    const candidate = addDays(event.isoDate, offset);
    if (legacyOccursOn(event, candidate)) found.push(candidate);
  }
  return found;
}

const isContiguous = (dates) =>
  dates.every((date, index) => index === 0 || addDays(dates[index - 1], 1) === date);

/** "月曜休館" / "月・火休館" -> [1] / [1, 2]. Returns [] when there is no such note. */
function closedWeekdaysFromNote(note) {
  if (!/休館/.test(note)) return [];
  const labels = ["日", "月", "火", "水", "木", "金", "土"];
  const beforeKeyword = note.slice(0, note.indexOf("休館"));
  const closed = labels
    .map((label, index) => (beforeKeyword.includes(label) ? index : -1))
    .filter((index) => index >= 0);
  return closed;
}

const payload = JSON.parse(await readFile(dataUrl, "utf8"));
const report = [];

for (const event of payload.events) {
  if (event.startDate) continue; // already migrated

  const occurrences = legacyOccurrences(event);
  if (occurrences.length === 0) {
    throw new Error(`${event.id}: legacy logic produced no occurrence dates`);
  }

  const note = event.weekday ?? "";
  const closedWeekdays = closedWeekdaysFromNote(note);

  const startDate = occurrences[0];
  const endDate = occurrences.at(-1);
  const contiguous = isContiguous(occurrences);

  // Rebuild the record with a stable key order so the diff stays readable.
  const migrated = {
    id: event.id,
    startDate,
    endDate,
    ...(contiguous ? {} : { dates: occurrences }),
    ...(closedWeekdays.length > 0 ? { closedWeekdays } : {}),
    dateNote: note,
    time: event.time,
    region: event.region,
    municipality: event.municipality,
    category: event.category,
    title: event.title,
    venue: event.venue,
    cost: event.cost,
    audience: event.audience,
    summary: event.summary,
    tags: event.tags,
    status: event.status,
    source: event.source,
  };

  report.push({
    id: event.id,
    was: `${event.month}月${event.day} (${note})`,
    now: contiguous ? `${startDate}..${endDate}` : occurrences.join(","),
    days: occurrences.length,
    closed: closedWeekdays.join("/") || "-",
  });

  Object.keys(event).forEach((key) => delete event[key]);
  Object.assign(event, migrated);
}

payload.updatedAt = "2026-07-25";
await writeFile(dataUrl, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(`migrated ${report.length} of ${payload.events.length} records\n`);
const multi = report.filter((row) => row.days > 1);
console.log(`--- multi-day records (${multi.length}) — verify these by eye ---`);
for (const row of multi) {
  console.log(`${row.was.padEnd(26)} -> ${row.now}  [${row.days}日, 休館=${row.closed}]`);
}
