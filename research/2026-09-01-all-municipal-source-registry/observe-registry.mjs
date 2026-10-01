import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";

const base = new URL("./", import.meta.url);
const registry = JSON.parse(await readFile(new URL("registry-candidates.json", base), "utf8"));
const observationsDir = new URL("observations/", base);
const maxBytes = 5 * 1024 * 1024;
const concurrency = 4;
const requestTimeoutMs = 15_000;

function jstDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function safeTimestamp(date = new Date()) {
  return date.toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
}

function normalizeHtml(bytes) {
  return new TextDecoder("utf-8", { fatal: false })
    .decode(bytes)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function readCappedBody(response) {
  if (!response.body) return { bytes: Buffer.alloc(0), truncated: false };
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return { bytes: Buffer.concat(chunks), truncated: true };
    }
    chunks.push(Buffer.from(value));
  }
  return { bytes: Buffer.concat(chunks), truncated: false };
}

async function latestObservation() {
  await mkdir(observationsDir, { recursive: true });
  const names = (await readdir(observationsDir))
    .filter((name) => /^observation-.*\.json$/.test(name))
    .sort();
  if (!names.length) return null;
  return JSON.parse(await readFile(new URL(names.at(-1), observationsDir), "utf8"));
}

function flattenSources() {
  return registry.municipalities.flatMap((municipality) =>
    municipality.sources
      .filter((source) => source.retrievalStatus === "available")
      .map((source) => ({
        municipality: municipality.name,
        region: municipality.region,
        ...source,
      })),
  );
}

async function observe(source, previousById) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(source.url, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/pdf,text/plain;q=0.8,*/*;q=0.5",
        "user-agent": "MieMonosashiSourceObserver/1.0 (read-only; one request per registered source)",
      },
    });
    const contentType = response.headers.get("content-type") || "unknown";
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400) {
      let redirectHost = null;
      try {
        redirectHost = new URL(location, source.url).host;
      } catch {}
      return {
        ...source,
        checkedAt: new Date().toISOString(),
        outcome: "redirect",
        httpStatus: response.status,
        redirectLocation: location,
        redirectHost,
        durationMs: Date.now() - startedAt,
      };
    }

    const { bytes, truncated } = await readCappedBody(response);
    const isHtml = contentType.toLowerCase().includes("text/html");
    const hashInput = isHtml ? normalizeHtml(bytes) : bytes;
    const contentHash = createHash("sha256").update(hashInput).digest("hex");
    const previous = previousById.get(source.id);
    const outcome = !previous
      ? "first-seen"
      : previous.contentHash === contentHash && previous.httpStatus === response.status
        ? "unchanged"
        : "changed";
    return {
      ...source,
      checkedAt: new Date().toISOString(),
      outcome,
      httpStatus: response.status,
      contentType,
      contentHash,
      hashBasis: isHtml ? "html-without-script-style-comments" : "raw-bytes",
      byteLength: bytes.byteLength,
      truncated,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ...source,
      checkedAt: new Date().toISOString(),
      outcome: "error",
      error: error?.name === "AbortError" ? "timeout" : String(error?.message || error),
      durationMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}

const previous = await latestObservation();
const previousById = new Map((previous?.observations || []).map((item) => [item.id, item]));
const configuredLimit = Number.parseInt(process.env.MIE_OBSERVE_LIMIT || "", 10);
const sources = flattenSources().slice(
  0,
  Number.isInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : undefined,
);
const observations = [];
let cursor = 0;

async function worker() {
  while (cursor < sources.length) {
    const source = sources[cursor];
    cursor += 1;
    observations.push(await observe(source, previousById));
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
observations.sort((left, right) =>
  `${left.region}/${left.municipality}/${left.id}`.localeCompare(
    `${right.region}/${right.municipality}/${right.id}`,
    "ja",
  ));

const summary = Object.fromEntries(
  ["first-seen", "unchanged", "changed", "redirect", "error"].map((outcome) => [
    outcome,
    observations.filter((item) => item.outcome === outcome).length,
  ]),
);
const payload = {
  version: 1,
  observationDate: jstDate(),
  createdAt: new Date().toISOString(),
  sourceRegistryObservedAt: registry.observedAt,
  scope: process.env.MIE_OBSERVE_LIMIT ? "limited-test" : "available-sources",
  requestedSources: sources.length,
  summary,
  observations,
};
const filename = `observation-${safeTimestamp()}.json`;
await writeFile(new URL(filename, observationsDir), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`${filename}: ${sources.length} sources`);
console.log(JSON.stringify(summary));
