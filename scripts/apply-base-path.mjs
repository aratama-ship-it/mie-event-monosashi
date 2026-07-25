/**
 * Rewrites built asset URLs for a GitHub Pages project site.
 *
 * Why this exists: a GitHub project site is served from `/<repo>/`, but vinext
 * 0.0.50 cannot prerender routes when a sub-path is configured. It prerenders by
 * fetching "/" from a temporary server, and setting either Next's `basePath` or
 * Vite's `base` makes those fetches return 404 ("RSC handler returned 404"), so
 * both real routes drop out of the export and only 404.html is emitted.
 *
 * So the build runs at the root and the sub-path is applied afterwards. The scope
 * is small and checked below:
 *   - our own links and asset references already carry it, via app/site-path.ts
 *   - the emitted CSS and JS contain no root-absolute asset URLs
 *   - only .html and .rsc files reference /assets/, and always inside quotes
 *
 * Also writes .nojekyll, because GitHub Pages runs Jekyll by default and Jekyll
 * drops directories beginning with an underscore — which would silently remove
 * assets/_vinext_fonts and leave the site without its fonts.
 *
 * Usage:  node scripts/apply-base-path.mjs <outDir> <basePath>
 *   e.g.  node scripts/apply-base-path.mjs dist/client /mie-event-monosashi
 *
 * Safe to run twice: an already-prefixed URL is left alone.
 */

import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

const [outDir, rawBasePath] = process.argv.slice(2);

if (!outDir) {
  console.error("usage: node scripts/apply-base-path.mjs <outDir> <basePath>");
  process.exit(1);
}

const basePath = (rawBasePath ?? "").replace(/\/$/, "");

async function* walk(dir) {
  for (const entry of await readdir(dir)) {
    const path = join(dir, entry);
    if ((await stat(path)).isDirectory()) yield* walk(path);
    else yield path;
  }
}

// Always emit .nojekyll, even when there is no base path to apply.
await writeFile(join(outDir, ".nojekyll"), "", "utf8");

if (!basePath) {
  console.log("no base path given; wrote .nojekyll only");
  process.exit(0);
}

let changedFiles = 0;
let replacements = 0;

for await (const path of walk(outDir)) {
  if (!/\.(html|rsc)$/.test(path)) continue;

  const original = await readFile(path, "utf8");

  // Only rewrite quoted root-absolute /assets/ URLs, and never one that already
  // starts with the base path.
  const pattern = new RegExp(`(["'(])/assets/`, "g");
  let count = 0;
  const updated = original.replace(pattern, (match, delimiter) => {
    count += 1;
    return `${delimiter}${basePath}/assets/`;
  });

  // React flight payloads also carry a bare "css:/assets/…" key.
  const withFlightKeys = updated.replace(/css:\/assets\//g, () => {
    count += 1;
    return `css:${basePath}/assets/`;
  });

  if (count === 0) continue;
  await writeFile(path, withFlightKeys, "utf8");
  changedFiles += 1;
  replacements += count;
}

console.log(
  `applied base path ${basePath}: ${replacements} URL(s) in ${changedFiles} file(s); wrote .nojekyll`,
);

// Fail loudly if anything root-absolute survived, rather than shipping a site
// whose assets 404.
const leftovers = [];
for await (const path of walk(outDir)) {
  if (!/\.(html|rsc|css|js)$/.test(path)) continue;
  const text = await readFile(path, "utf8");
  const bad = text.match(new RegExp(`["'(]/(?!${basePath.slice(1)}/)assets/`, "g"));
  if (bad) leftovers.push(`${path} (${bad.length})`);
}

if (leftovers.length) {
  console.error("\nroot-absolute asset URLs remain:");
  for (const item of leftovers) console.error(`- ${item}`);
  process.exit(1);
}
