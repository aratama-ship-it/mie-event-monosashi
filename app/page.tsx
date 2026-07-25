import EventFinder from "./event-finder";

/**
 * The listing is built entirely from `data/events.json` at build time, so there
 * is nothing to render per request.
 *
 * This declaration is what makes the route prerenderable. vinext classifies
 * routes by static analysis, and a page without an explicit `dynamic` export
 * comes out as unclassified — which the static export then skips, leaving the
 * GitHub Pages build with only a 404 page. The finder itself is a client
 * component, and route segment config cannot live in a "use client" file, hence
 * this thin server wrapper.
 */
export const dynamic = "force-static";

export default function Home() {
  return <EventFinder />;
}
