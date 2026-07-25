import type { NextConfig } from "next";

/**
 * Two build targets.
 *
 * Default: server rendering on Cloudflare Workers, which is what ChatGPT Sites
 * deploys. `dist/client` holds only assets and the Worker renders the HTML.
 *
 * STATIC_EXPORT=1: a static export for GitHub Pages, which can only serve files.
 *
 * Note that `basePath` is NOT set even though a GitHub project site lives under
 * `/<repo>/`. vinext 0.0.50 prerenders by fetching "/" from a temporary server,
 * and setting `basePath` makes those fetches return 404, so both real routes drop
 * out of the export and only 404.html is emitted. The sub-path is applied instead
 * by app/site-path.ts (our own links) and scripts/apply-base-path.mjs (asset URLs
 * in the built output).
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = isStaticExport
  ? {
      output: "export",
      // Pages serves /foo/ as /foo/index.html, so emit directories, not foo.html.
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
