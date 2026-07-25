/**
 * Sub-path handling for GitHub Pages.
 *
 * A GitHub project site is served from `/<repo>/`, so every absolute URL needs
 * that prefix. Next's own `basePath` would normally do this, but vinext 0.0.50
 * fails to prerender routes when `basePath` is set (`RSC handler returned 404`),
 * and prerendering is the whole point of the static build. So instead:
 *
 *   - asset URLs (JS, CSS, fonts) come from Vite's `base`, set in vite.config.ts
 *   - links and files referenced from our own markup go through `sitePath()`
 *
 * SITE_BASE_PATH is empty for the Cloudflare Workers build and for local dev,
 * where the site is served from the root.
 *
 * This works only because the site navigates with plain `<a>` elements rather
 * than `next/link`; there is no client-side router holding absolute route
 * strings. Adding `next/link` later would need this revisited.
 */
const raw = process.env.SITE_BASE_PATH ?? "";

/** "" or "/mie-event-monosashi" — never with a trailing slash. */
export const basePath = raw.endsWith("/") ? raw.slice(0, -1) : raw;

/** Prefixes a root-relative path with the base path. */
export function sitePath(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${basePath}${path}`;
}
