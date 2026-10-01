import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const base = new URL("./", import.meta.url);
const registry = JSON.parse(await readFile(new URL("registry-candidates.json", base), "utf8"));

const expectedMunicipalities = new Set([
  "津市", "四日市市", "伊勢市", "松阪市", "桑名市", "鈴鹿市", "名張市",
  "尾鷲市", "亀山市", "鳥羽市", "熊野市", "いなべ市", "志摩市", "伊賀市",
  "木曽岬町", "東員町", "菰野町", "朝日町", "川越町", "多気町", "明和町",
  "大台町", "玉城町", "度会町", "大紀町", "南伊勢町", "紀北町", "御浜町", "紀宝町",
]);
const allowedKinds = new Set(["municipality", "tourism", "public-facility"]);
const allowedRoles = new Set(["signal", "both"]);
const allowedStatuses = new Set(["available", "partial", "blocked", "not-found"]);
const errors = [];
const municipalityNames = new Set();
const sourceIds = new Set();
const sourceUrls = new Map();

for (const [municipalityIndex, municipality] of registry.municipalities.entries()) {
  const where = `municipalities[${municipalityIndex}]`;
  if (!expectedMunicipalities.has(municipality.name)) errors.push(`${where}.name is not official`);
  if (municipalityNames.has(municipality.name)) errors.push(`${where}.name is duplicated`);
  municipalityNames.add(municipality.name);
  if (!municipality.region) errors.push(`${where}.region is required`);
  if (!Array.isArray(municipality.sources) || municipality.sources.length === 0) {
    errors.push(`${where}.sources must be non-empty`);
  }
  for (const [sourceIndex, source] of municipality.sources.entries()) {
    const at = `${where}.sources[${sourceIndex}]`;
    for (const key of [
      "id", "label", "kind", "role", "url", "format", "retrievalStatus",
      "suggestedFrequency", "evidenceNote",
    ]) {
      if (!source[key]) errors.push(`${at}.${key} is required`);
    }
    if (sourceIds.has(source.id)) errors.push(`${at}.id is duplicated: ${source.id}`);
    sourceIds.add(source.id);
    if (!allowedKinds.has(source.kind)) errors.push(`${at}.kind is invalid: ${source.kind}`);
    if (!allowedRoles.has(source.role)) errors.push(`${at}.role is invalid: ${source.role}`);
    if (!allowedStatuses.has(source.retrievalStatus)) {
      errors.push(`${at}.retrievalStatus is invalid: ${source.retrievalStatus}`);
    }
    if (!source.url.startsWith("https://")) errors.push(`${at}.url must be HTTPS`);
    const prior = sourceUrls.get(source.url);
    if (prior) errors.push(`${at}.url duplicates ${prior}: ${source.url}`);
    sourceUrls.set(source.url, at);
  }
}

for (const name of expectedMunicipalities) {
  if (!municipalityNames.has(name)) errors.push(`missing municipality: ${name}`);
}
if (municipalityNames.size !== expectedMunicipalities.size) {
  errors.push(`municipality count is ${municipalityNames.size}; expected ${expectedMunicipalities.size}`);
}

const protectedFiles = [
  ["../../data/events.json", "e798f71dba84b968023d9534f46884fc11176024005ec153d7d0cf1b88191284"],
  ["../../tests/rendered-html.test.mjs", "2011274afa202cc094c1a913f0168b85f3ba2ed90f517de2f428bdcf0f03d121"],
  ["../../data/municipal-sources.json", "a147f53779e1cb7667a0b2582ccc72902d37096cc2c93f8330e2e7b98597a82e"],
  ["../../scripts/validate-events.mjs", "4cfb6a9348db224e8fc2f0c40223d4dec4706c33846cc20a9059f50759ad1fe4"],
];

for (const [relativePath, expectedHash] of protectedFiles) {
  const content = await readFile(new URL(relativePath, base));
  const actualHash = createHash("sha256").update(content).digest("hex");
  if (actualHash !== expectedHash) errors.push(`protected file changed: ${relativePath}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  const sources = registry.municipalities.flatMap((municipality) => municipality.sources);
  const statusCounts = Object.fromEntries(
    [...allowedStatuses].map((status) => [
      status,
      sources.filter((source) => source.retrievalStatus === status).length,
    ]),
  );
  console.log(
    `Registry candidate OK: ${municipalityNames.size} municipalities, ` +
    `${sources.length} unique sources; protected baseline unchanged.`,
  );
  console.log(JSON.stringify(statusCounts));
}
