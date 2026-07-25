/**
 * Serves the GitHub Pages build the way GitHub Pages serves it — under the
 * project sub-path, not at the root.
 *
 * Loading dist/client directly at "/" would hide exactly the bugs this build is
 * prone to, because every asset URL carries the sub-path. This mounts the output
 * at SITE_BASE_PATH and redirects "/" there.
 *
 * Usage:  node scripts/serve-pages.mjs [port]
 */

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const port = Number(process.argv[2] ?? process.env.PORT ?? 4181);
const basePath = (process.env.SITE_BASE_PATH ?? "/mie-event-monosashi").replace(/\/$/, "");
const root = resolve("dist/client");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".rsc": "text/x-component; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

async function resolveFile(pathname) {
  // Strip the mount point.
  if (basePath && !pathname.startsWith(basePath)) return null;
  const relative = basePath ? pathname.slice(basePath.length) : pathname;
  const safe = normalize(relative).replace(/^(\.\.[/\\])+/, "");
  const target = join(root, safe);

  try {
    const info = await stat(target);
    // Directory URLs are served as index.html, the same as GitHub Pages.
    if (info.isDirectory()) {
      const index = join(target, "index.html");
      await stat(index);
      return index;
    }
    return target;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${port}`);

  if (basePath && (pathname === "/" || pathname === "")) {
    res.writeHead(302, { location: `${basePath}/` });
    res.end();
    return;
  }

  // GitHub Pages redirects /foo to /foo/ when /foo/index.html exists.
  if (!extname(pathname) && !pathname.endsWith("/")) {
    const asDirectory = await resolveFile(`${pathname}/`);
    if (asDirectory) {
      res.writeHead(301, { location: `${pathname}/` });
      res.end();
      return;
    }
  }

  const file = await resolveFile(pathname);
  if (!file) {
    const notFound = await resolveFile(`${basePath}/404.html`);
    res.writeHead(404, { "content-type": TYPES[".html"] });
    if (notFound) createReadStream(notFound).pipe(res);
    else res.end("404");
    return;
  }

  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`GitHub Pages preview: http://localhost:${port}${basePath}/`);
});
