import { readFile } from "node:fs/promises";

const dataUrl = new URL("../data/events.json", import.meta.url);
const payload = JSON.parse(await readFile(dataUrl, "utf8"));
const municipalSourcesUrl = new URL("../data/municipal-sources.json", import.meta.url);
const municipalSources = JSON.parse(await readFile(municipalSourcesUrl, "utf8"));
const discoverySourcesUrl = new URL("../data/discovery-sources.json", import.meta.url);
const discoverySources = JSON.parse(await readFile(discoverySourcesUrl, "utf8"));
const festivalWatchlistUrl = new URL("../data/festival-watchlist.json", import.meta.url);
const festivalWatchlist = JSON.parse(await readFile(festivalWatchlistUrl, "utf8"));
const facilitySourcesUrl = new URL("../data/facility-sources.json", import.meta.url);
const facilitySources = JSON.parse(await readFile(facilitySourcesUrl, "utf8"));

const allowedFacilityTypes = new Set(["mall", "commercial_resort", "department_store"]);
const facilityNames = new Set(
  (facilitySources.facilities ?? []).map((facility) => facility.name),
);

const required = [
  "id",
  "startDate",
  "endDate",
  "dateNote",
  "time",
  "region",
  "municipality",
  "category",
  "title",
  "venue",
  "cost",
  "audience",
  "summary",
  "tags",
  "status",
  "source",
];

const ids = new Set();
const errors = [];
const warnings = [];
const categories = new Set(["祭り", "舞台", "音楽", "展覧会", "学び", "交流", "スポーツ"]);
const childFits = new Set([
  "for-children",
  "allowed",
  "conditional",
  "not-for-children",
  "unknown",
]);

// Freshness is judged against a fixed date so that `npm run data:check` gives the
// same answer on every machine and in scheduled runs. Bump it when auditing.
const auditDate = process.env.MIE_AUDIT_DATE ?? new Date().toISOString().slice(0, 10);

if (!Array.isArray(payload.events) || payload.events.length === 0) {
  errors.push("events must be a non-empty array");
}

for (const [index, event] of (payload.events ?? []).entries()) {
  const where = `events[${index}]`;

  for (const key of required) {
    if (event[key] === undefined || event[key] === null || event[key] === "") {
      errors.push(`${where}.${key} is required`);
    }
  }

  if (ids.has(event.id)) errors.push(`${where}.id is duplicated: ${event.id}`);
  ids.add(event.id);

  for (const key of ["startDate", "endDate"]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event[key] ?? "")) {
      errors.push(`${where}.${key} must be YYYY-MM-DD`);
    }
  }

  if (event.startDate && event.endDate && event.endDate < event.startDate) {
    errors.push(`${where}.endDate must not precede startDate`);
  }

  // `dates` is the authoritative occurrence list for non-contiguous series, so it
  // must agree with the range it sits inside.
  if (event.dates !== undefined) {
    if (!Array.isArray(event.dates) || event.dates.length === 0) {
      errors.push(`${where}.dates must be a non-empty array when present`);
    } else {
      if (event.dates[0] !== event.startDate) {
        errors.push(`${where}.dates must begin at startDate`);
      }
      if (event.dates.at(-1) !== event.endDate) {
        errors.push(`${where}.dates must end at endDate`);
      }
      for (const date of event.dates) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          errors.push(`${where}.dates contains a non-ISO date: ${date}`);
        }
      }
      const sorted = [...event.dates].every(
        (date, index) => index === 0 || event.dates[index - 1] < date,
      );
      if (!sorted) errors.push(`${where}.dates must be sorted and unique`);
    }
  }

  if (event.closedWeekdays !== undefined) {
    const valid =
      Array.isArray(event.closedWeekdays) &&
      event.closedWeekdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6);
    if (!valid) errors.push(`${where}.closedWeekdays must be integers 0-6`);
    if (event.dates) {
      errors.push(`${where} must not combine closedWeekdays with an explicit dates list`);
    }
  }

  // `time` sits in the card's small metadata row alongside category, region and
  // the child badge. Anything much longer than this wraps the row and breaks the
  // layout, so session-by-session detail belongs in `summary` instead.
  if (event.time && [...event.time].length > 32) {
    errors.push(
      `${where}.time is ${[...event.time].length} characters; keep it under 32 and move detail to summary`,
    );
  }

  if (!Array.isArray(event.tags) || event.tags.length === 0) {
    errors.push(`${where}.tags must contain at least one tag`);
  }

  // A commercial-facility event must say so in both places, because the site
  // filters on the tag while the facility name drives grouping.
  if (event.facility !== undefined) {
    if (!event.facility.name) errors.push(`${where}.facility.name is required`);
    if (!allowedFacilityTypes.has(event.facility.type)) {
      errors.push(`${where}.facility.type is not allowed: ${event.facility.type}`);
    }
    if (!event.tags?.includes("商業施設")) {
      errors.push(`${where} has a facility but is missing the 商業施設 tag`);
    }
    if (!facilityNames.has(event.facility.name)) {
      errors.push(
        `${where}.facility.name is not registered in facility-sources.json: ${event.facility.name}`,
      );
    }
  } else if (event.tags?.includes("商業施設")) {
    errors.push(`${where} is tagged 商業施設 but has no facility record`);
  }

  if (!categories.has(event.category)) {
    errors.push(`${where}.category is not an allowed category: ${event.category}`);
  }

  // Optional: pins the child rating where the wording of `audience` would be
  // read the wrong way round. Must stay one of the five published ratings.
  if (event.childFit !== undefined && !childFits.has(event.childFit)) {
    errors.push(`${where}.childFit is not an allowed rating: ${event.childFit}`);
  }

  if (event.category === "スポーツ" && !event.tags.includes("日程変更注意")) {
    errors.push(`${where}.tags must include 日程変更注意 for sports events`);
  }

  if (!event.source || event.source.kind !== "primary") {
    errors.push(`${where}.source.kind must be primary`);
  }

  if (!event.source?.url?.startsWith("https://")) {
    errors.push(`${where}.source.url must be an HTTPS primary-source URL`);
  }

  for (const key of ["label", "verifiedAt", "nextCheckAt"]) {
    if (!event.source?.[key]) errors.push(`${where}.source.${key} is required`);
  }

  if (event.status !== "published") {
    errors.push(`${where}.status must be published before it can appear`);
  }
}

const expectedEastKishu = new Set(["尾鷲市", "熊野市", "紀北町", "御浜町", "紀宝町"]);
const municipalityNames = new Set();

if (!Array.isArray(municipalSources.municipalities)) {
  errors.push("municipal-sources.municipalities must be an array");
}

for (const [index, municipality] of (municipalSources.municipalities ?? []).entries()) {
  const where = `municipalities[${index}]`;
  if (!expectedEastKishu.has(municipality.name)) {
    errors.push(`${where}.name is outside the East Kishu registry: ${municipality.name}`);
  }
  if (municipalityNames.has(municipality.name)) {
    errors.push(`${where}.name is duplicated: ${municipality.name}`);
  }
  municipalityNames.add(municipality.name);

  for (const key of ["name", "priority", "note"]) {
    if (!municipality[key]) errors.push(`${where}.${key} is required`);
  }

  if (!Array.isArray(municipality.sources) || municipality.sources.length === 0) {
    errors.push(`${where}.sources must contain at least one official route`);
  }

  for (const [sourceIndex, source] of (municipality.sources ?? []).entries()) {
    const sourceWhere = `${where}.sources[${sourceIndex}]`;
    if (!source.label) errors.push(`${sourceWhere}.label is required`);
    if (!new Set(["municipality", "organizer"]).has(source.kind)) {
      errors.push(`${sourceWhere}.kind must be municipality or organizer`);
    }
    if (!source.url?.startsWith("https://")) {
      errors.push(`${sourceWhere}.url must be HTTPS`);
    }
  }
}

for (const name of expectedEastKishu) {
  if (!municipalityNames.has(name)) errors.push(`municipal source registry is missing ${name}`);
}

const discoverySourceIds = new Set();
const allowedDiscoveryRoles = new Set(["signal", "confirmation"]);
const allowedDiscoveryTypes = new Set([
  "vendor_schedule",
  "aggregator_schedule",
  "organizer_calendar",
  "venue_calendar",
  "venue_recruitment",
  "municipal_newsletter",
  "municipal_news",
  "organizer_booking",
  "municipal_calendar",
  "community_news",
  "tourism_portal",
]);

if (!Array.isArray(discoverySources.sources) || discoverySources.sources.length === 0) {
  errors.push("discovery-sources.sources must be a non-empty array");
}

for (const [index, source] of (discoverySources.sources ?? []).entries()) {
  const where = `discovery-sources[${index}]`;
  for (const key of [
    "id",
    "label",
    "municipality",
    "sourceType",
    "role",
    "url",
    "checkCadence",
    "note",
  ]) {
    if (!source[key]) errors.push(`${where}.${key} is required`);
  }
  if (discoverySourceIds.has(source.id)) errors.push(`${where}.id is duplicated: ${source.id}`);
  discoverySourceIds.add(source.id);
  if (!allowedDiscoveryRoles.has(source.role)) {
    errors.push(`${where}.role is not allowed: ${source.role}`);
  }
  if (!allowedDiscoveryTypes.has(source.sourceType)) {
    errors.push(`${where}.sourceType is not allowed: ${source.sourceType}`);
  }
  if (!source.url?.startsWith("https://")) errors.push(`${where}.url must be HTTPS`);
}

const festivalCandidateIds = new Set();
const allowedFestivalStatuses = new Set([
  "needs_details",
  "needs_2026_confirmation",
  "needs_primary_event_detail",
  "needs_primary_source",
  "source_conflict",
]);

if (!Array.isArray(festivalWatchlist.candidates)) {
  errors.push("festival-watchlist.candidates must be an array");
}

for (const [index, candidate] of (festivalWatchlist.candidates ?? []).entries()) {
  const where = `festival-watchlist[${index}]`;
  for (const key of [
    "id",
    "municipality",
    "title",
    "expectedDate",
    "status",
    "nextCheckAt",
    "childStatus",
  ]) {
    if (!candidate[key]) errors.push(`${where}.${key} is required`);
  }
  if (festivalCandidateIds.has(candidate.id)) {
    errors.push(`${where}.id is duplicated: ${candidate.id}`);
  }
  festivalCandidateIds.add(candidate.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate.expectedDate ?? "")) {
    errors.push(`${where}.expectedDate must be YYYY-MM-DD`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate.nextCheckAt ?? "")) {
    errors.push(`${where}.nextCheckAt must be YYYY-MM-DD`);
  }
  if (!allowedFestivalStatuses.has(candidate.status)) {
    errors.push(`${where}.status is not allowed: ${candidate.status}`);
  }
  if (candidate.publishable !== false) {
    errors.push(`${where}.publishable must stay false until promoted to events.json`);
  }
  if (!Array.isArray(candidate.known) || candidate.known.length === 0) {
    errors.push(`${where}.known must contain evidence`);
  }
  if (!Array.isArray(candidate.missing) || candidate.missing.length === 0) {
    errors.push(`${where}.missing must contain unresolved facts`);
  }
  if (!Array.isArray(candidate.sourceUrls) || candidate.sourceUrls.length === 0) {
    errors.push(`${where}.sourceUrls must contain at least one source`);
  }
  for (const sourceUrl of candidate.sourceUrls ?? []) {
    if (!sourceUrl.startsWith("https://")) {
      errors.push(`${where}.sourceUrls must contain HTTPS URLs`);
    }
  }
}

const facilityIds = new Set();
const allowedCoverageStatuses = new Set([
  "not_started",
  "source_confirmed",
  "published",
]);

if (!Array.isArray(facilitySources.facilities) || facilitySources.facilities.length === 0) {
  errors.push("facility-sources.facilities must be a non-empty array");
}

for (const [index, facility] of (facilitySources.facilities ?? []).entries()) {
  const where = `facility-sources[${index}]`;
  for (const key of ["id", "name", "type", "municipality", "region", "eventPageUrl", "note"]) {
    if (!facility[key]) errors.push(`${where}.${key} is required`);
  }
  if (facilityIds.has(facility.id)) errors.push(`${where}.id is duplicated: ${facility.id}`);
  facilityIds.add(facility.id);
  if (!allowedFacilityTypes.has(facility.type)) {
    errors.push(`${where}.type is not allowed: ${facility.type}`);
  }
  if (!allowedCoverageStatuses.has(facility.coverageStatus)) {
    errors.push(`${where}.coverageStatus is not allowed: ${facility.coverageStatus}`);
  }
  if (!facility.eventPageUrl?.startsWith("https://")) {
    errors.push(`${where}.eventPageUrl must be HTTPS`);
  }
  // A facility we claim to publish from must actually have been checked.
  if (facility.coverageStatus === "published" && !facility.lastCheckedAt) {
    errors.push(`${where}.lastCheckedAt is required once coverageStatus is published`);
  }
  // Held-back candidates must record why, so nothing is silently dropped.
  for (const [pendingIndex, pending] of (facility.pending ?? []).entries()) {
    const pendingWhere = `${where}.pending[${pendingIndex}]`;
    if (!pending.title) errors.push(`${pendingWhere}.title is required`);
    if (!pending.reason) errors.push(`${pendingWhere}.reason is required`);
  }
}

// --- Freshness. These are warnings, not errors: stale data must be visible
// --- without blocking a build, because the fix is research, not a code change.

const events = payload.events ?? [];
const addDays = (isoDate, amount) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

const overdueChecks = events.filter((event) => event.source?.nextCheckAt < auditDate);
if (overdueChecks.length) {
  warnings.push(
    `${overdueChecks.length} record(s) are past source.nextCheckAt and need re-verification: ` +
      overdueChecks
        .slice(0, 5)
        .map((event) => `${event.source.nextCheckAt} ${event.title}`)
        .join(" / ") +
      (overdueChecks.length > 5 ? ` …and ${overdueChecks.length - 5} more` : ""),
  );
}

const ended = events.filter((event) => event.endDate < auditDate);
if (ended.length) {
  warnings.push(
    `${ended.length} record(s) have finished and are hidden from the site; archive or remove them: ` +
      ended
        .slice(0, 5)
        .map((event) => `${event.endDate} ${event.title}`)
        .join(" / "),
  );
}

// The site's real failure mode is running dry, so measure the runway explicitly.
const horizon = addDays(auditDate, 30);
const upcoming = events.filter(
  (event) => event.endDate >= auditDate && event.startDate <= horizon,
);
const beyondHorizon = events.filter((event) => event.startDate > horizon);

if (upcoming.length < 20) {
  warnings.push(
    `only ${upcoming.length} record(s) fall in the next 30 days (${auditDate}..${horizon}); the listing will look empty`,
  );
}
if (beyondHorizon.length < 10) {
  warnings.push(
    `only ${beyondHorizon.length} record(s) start more than 30 days out; collection is running dry beyond ${horizon}`,
  );
}

if (errors.length) {
  console.error(`Event data validation failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Event data OK: ${events.length} primary-source records, ${ids.size} unique IDs; municipal routes OK: ${municipalityNames.size} East Kishu municipalities; discovery routes OK: ${discoverySourceIds.size} sources; festival watchlist OK: ${festivalCandidateIds.size} unpublished candidates`,
);
const facilityEvents = events.filter((event) => event.facility);
const publishedFacilities = (facilitySources.facilities ?? []).filter(
  (facility) => facility.coverageStatus === "published",
);
const pendingCount = (facilitySources.facilities ?? []).reduce(
  (total, facility) => total + (facility.pending?.length ?? 0),
  0,
);

console.log(
  `Coverage as of ${auditDate}: ${upcoming.length} in the next 30 days, ${beyondHorizon.length} beyond that.`,
);
console.log(
  `Facilities: ${facilityIds.size} registered, ${publishedFacilities.length} publishing, ${facilityEvents.length} facility events, ${pendingCount} candidate(s) held for judgement.`,
);

if (warnings.length) {
  console.warn(`\nFreshness warnings (${warnings.length}):`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}
