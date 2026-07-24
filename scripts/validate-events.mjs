import { readFile } from "node:fs/promises";

const dataUrl = new URL("../data/events.json", import.meta.url);
const payload = JSON.parse(await readFile(dataUrl, "utf8"));
const municipalSourcesUrl = new URL("../data/municipal-sources.json", import.meta.url);
const municipalSources = JSON.parse(await readFile(municipalSourcesUrl, "utf8"));
const discoverySourcesUrl = new URL("../data/discovery-sources.json", import.meta.url);
const discoverySources = JSON.parse(await readFile(discoverySourcesUrl, "utf8"));

const required = [
  "id",
  "isoDate",
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
  "period",
  "status",
  "source",
];

const ids = new Set();
const errors = [];
const categories = new Set(["祭り", "舞台", "音楽", "展覧会", "学び", "交流", "スポーツ"]);
const periods = new Set(["weekend", "august", "september"]);

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

  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.isoDate ?? "")) {
    errors.push(`${where}.isoDate must be YYYY-MM-DD`);
  }

  if (!Array.isArray(event.tags) || event.tags.length === 0) {
    errors.push(`${where}.tags must contain at least one tag`);
  }

  if (!categories.has(event.category)) {
    errors.push(`${where}.category is not an allowed category: ${event.category}`);
  }

  if (!periods.has(event.period)) {
    errors.push(`${where}.period is not an allowed period: ${event.period}`);
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

if (errors.length) {
  console.error(`Event data validation failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Event data OK: ${payload.events.length} primary-source records, ${ids.size} unique IDs; municipal routes OK: ${municipalityNames.size} East Kishu municipalities; discovery routes OK: ${discoverySourceIds.size} sources`,
);
