import vinext from "vinext";
import { defineConfig } from "vite";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

// The default build still targets Cloudflare Workers, because `npm test` renders
// the site through the built worker. The site itself is published as a static
// export to GitHub Pages — see next.config.ts. No D1 or R2 bindings are in use.
const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: [],
  r2_buckets: [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // The GitHub Pages build emits plain files, so there is no Worker to configure
  // and no Cloudflare bindings to attach.
  //
  // `base` is deliberately left at the root. vinext 0.0.50 prerenders by fetching
  // "/" from a temporary server, and any sub-path — Next's `basePath` or Vite's
  // `base` — makes those fetches 404 ("RSC handler returned 404"), which drops
  // both real routes from the export. Asset URLs are therefore rewritten after
  // the build by scripts/apply-base-path.mjs; links in our own markup go through
  // app/site-path.ts.
  if (process.env.STATIC_EXPORT === "1") {
    return { plugins: [vinext()] };
  }

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
