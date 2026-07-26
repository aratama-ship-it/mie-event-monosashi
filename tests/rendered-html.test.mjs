import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  datePresets,
  describeEventDate,
  eventOccursOn,
  formatEventDate,
} from "../lib/event-dates.mjs";

const payload = JSON.parse(
  await readFile(new URL("../data/events.json", import.meta.url), "utf8"),
);

/** Same "today" the page uses, so expectations track the rendered output. */
const todayIso = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})
  .format(new Date())
  .replaceAll("/", "-");

const liveEvents = payload.events.filter((event) => event.endDate >= todayIso);
const endedEvents = payload.events.filter((event) => event.endDate < todayIso);

/** The site's own base path, so link assertions work under either build. */
function sitePath(path) {
  const base = (process.env.SITE_BASE_PATH ?? "").replace(/\/$/, "");
  return `${base}${path}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** React escapes these when it serialises text, so assertions must too. */
function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Mie event finder and records without collection-method sections", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>みえのものさし｜三重県のイベントを参加条件で探す<\/title>/);
  assert.match(html, /class="mie-silhouette" aria-hidden="true"/);
  assert.match(html, /祭りも、試合も、音も、展覧会も、三重の予定へ。/);
  assert.match(html, /何を見たい？/);
  assert.match(html, />今日</);
  assert.match(html, />明日</);
  assert.match(html, /日付を指定/);
  assert.match(html, /30日カレンダー/);
  assert.match(html, /<details class="date-calendar">/);
  assert.match(html, /<summary class="date-calendar-summary">/);
  assert.doesNotMatch(html, /<details class="date-calendar" open/);
  assert.match(html, /type="date"/);
  assert.equal([...html.matchAll(/data-calendar-date=/g)].length, 30);
  assert.match(html, /音楽・ライブ/);
  assert.match(html, /子どものものさし/);
  assert.match(html, /公式の「対象」記載から判定/);
  assert.match(html, /子ども向け/);
  assert.match(html, /子ども参加可/);
  assert.match(html, /条件あり/);
  assert.match(html, /子ども対象外/);
  assert.match(html, /公式で要確認/);
  assert.match(html, /<option[^>]*>展覧会<\/option>/);
  assert.match(html, /<option[^>]*>伊賀<\/option>/);
  for (const preset of datePresets(todayIso)) {
    assert.ok(html.includes(preset.label), `missing date preset: ${preset.label}`);
  }
  assert.doesNotMatch(html, /会場だけでは、拾いきれない。/);
  assert.doesNotMatch(html, /薄い地域ほど、先に見に行く。/);
  assert.doesNotMatch(html, /出店予定から、町の一日を逆引きする。/);
  assert.match(html, /ライブ、JFL、花火、展覧会…/);
  assert.match(html, /class="hero-mobile-actions"/);
  // Data-driven on purpose. The listing changes every day as dates pass, so
  // pinning specific titles here made the suite rot instead of catching bugs.
  assert.match(
    html,
    new RegExp(`href="#results">催しを見る <strong>${liveEvents.length}</strong></a>`),
  );

  for (const event of liveEvents) {
    assert.ok(
      html.includes(escapeHtml(event.title)),
      `a current event is missing from the listing: ${event.title}`,
    );
  }

  // An event that has finished must not be offered to anyone.
  for (const event of endedEvents) {
    assert.ok(
      !html.includes(escapeHtml(event.title)),
      `a finished event is still listed: ${event.title} (ended ${event.endDate})`,
    );
  }

  for (const category of ["スポーツ", "交流", "展覧会"]) {
    if (liveEvents.some((event) => event.category === category)) {
      assert.match(html, new RegExp(`data-category="${category}"`));
    }
  }

  assert.match(html, /公式情報で最終確認/);
  assert.doesNotMatch(html, />再確認 /);
  assert.doesNotMatch(html, /codex-preview/);

  const eventCards = [...html.matchAll(/<article class="event-card"[\s\S]*?<\/article>/g)].map(
    (match) => match[0],
  );
  assert.equal(eventCards.length, liveEvents.length);

  // Every card must carry a child rating, and an already-running multi-day
  // event must be flagged so it reads differently from a one-day festival.
  for (const card of eventCards) {
    assert.match(card, /data-child-fit="(for-children|allowed|conditional|not-for-children|unknown)"/);
  }

  // The date note is drawn as a fixed 28px circle, which only fits one
  // character. `dateNote` also carries editorial text like "月曜休館", so anything
  // longer has to opt out of the circle or it spills over the card.
  for (const card of eventCards) {
    const note = card.match(/<em class="date-note-([a-z]+)">([\s\S]*?)<\/em>/);
    assert.ok(note, `a card renders a date note without a kind class: ${card.slice(0, 120)}`);
    const [, kind, text] = note;
    assert.ok(
      ["weekday", "weekdays", "note"].includes(kind),
      `unexpected date-note kind: ${kind}`,
    );
    if (kind === "weekday") {
      assert.equal(
        [...text.trim()].length,
        1,
        `"${text.trim()}" is drawn as the single-character circle but is longer`,
      );
    }
  }

  const cardFor = (title) => eventCards.find((card) => card.includes(escapeHtml(title))) ?? "";

  // A record that pins its child rating must win over the wording of `audience`.
  for (const event of liveEvents.filter((item) => item.childFit)) {
    assert.match(
      cardFor(event.title),
      new RegExp(`data-child-fit="${event.childFit}"`),
      `${event.id} does not render its pinned child rating ${event.childFit}`,
    );
  }

  const ongoing = liveEvents.filter(
    (event) => event.startDate < todayIso && event.endDate >= todayIso,
  );
  for (const event of ongoing) {
    assert.match(cardFor(event.title), /data-ongoing="true"/);
    assert.match(cardFor(event.title), /開催中/);
  }
});

test("kitchen-car experiment lives on its own linked page", async () => {
  const response = await render("/kitchen-cars");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>キッチンカーは、今日どこへ。｜みえのものさし<\/title>/);
  assert.match(html, /aria-current="page"[^>]*>キッチンカー<\/a>/);
  assert.match(html, /キッチンカーは、今日どこへ。/);
  assert.match(html, /使うかどうかは未定/);
  assert.match(html, /cafe＆crepe PECOCO/);
  assert.match(html, /Goofy BURGER/);
  assert.match(html, /現在表示 2台 \/ 調査候補 15台/);
  // Links carry SITE_BASE_PATH, which is empty here and "/<repo>" for the GitHub
  // Pages build, so build the expected href rather than pinning the root.
  assert.match(
    html,
    new RegExp(`href="${escapeRegExp(sitePath("/"))}"[^>]*>催し一覧へ戻る</a>`),
  );
});

test("all published records keep primary-source and sports-freshness fields", async () => {
  const raw = await readFile(new URL("../data/events.json", import.meta.url), "utf8");
  const payload = JSON.parse(raw);
  const sports = payload.events.filter((event) => event.category === "スポーツ");

  // Invariants rather than a head count: the listing is meant to grow, and a
  // pinned total only ever fails for the wrong reason.
  assert.ok(payload.events.length > 0);
  assert.equal(new Set(payload.events.map((event) => event.id)).size, payload.events.length);
  const allowedCategories = new Set([
    "祭り",
    "舞台",
    "音楽",
    "展覧会",
    "学び",
    "交流",
    "スポーツ",
  ]);
  for (const event of payload.events) {
    assert.ok(allowedCategories.has(event.category), `unexpected category: ${event.category}`);
  }
  assert.deepEqual(
    payload.events
      .filter((event) => event.id.startsWith("ise-okihiki-kawabiki-"))
      .map((event) => event.startDate)
      .sort(),
    ["2026-07-25", "2026-07-26", "2026-08-01", "2026-08-02"],
  );
  assert.deepEqual(
    new Set(
      [
        "桑名市",
        "紀北町",
        "御浜町",
        "大紀町",
        "南伊勢町",
        "朝日町",
        "木曽岬町",
        "度会町",
        "いなべ市",
        "多気町",
        "川越町",
      ].filter((name) =>
        payload.events.some((event) => event.municipality === name),
      ),
    ),
    new Set([
      "桑名市",
      "紀北町",
      "御浜町",
      "大紀町",
      "南伊勢町",
      "朝日町",
      "木曽岬町",
      "度会町",
      "いなべ市",
      "多気町",
      "川越町",
    ]),
  );

  for (const event of payload.events) {
    assert.equal(event.status, "published");
    assert.equal(event.source.kind, "primary");
    assert.match(event.source.url, /^https:\/\//);
    assert.match(event.source.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(event.source.nextCheckAt, /^\d{4}-\d{2}-\d{2}$/);
  }

  for (const event of sports) {
    assert.ok(event.tags.includes("日程変更注意"));
  }
});

test("30-day calendar counts single, continuous, and recurring dates", async () => {
  const raw = await readFile(new URL("../data/events.json", import.meta.url), "utf8");
  const payload = JSON.parse(raw);
  const event = (id) => payload.events.find((item) => item.id === id);

  assert.equal(eventOccursOn(event("tsu-hanabi-2026"), "2026-07-25"), true);
  assert.equal(eventOccursOn(event("tsu-hanabi-2026"), "2026-07-26"), false);

  assert.equal(
    eventOccursOn(event("mie-art-rockefeller-flower-bird-prints-2026"), "2026-07-25"),
    true,
  );
  assert.equal(
    eventOccursOn(event("mie-art-rockefeller-flower-bird-prints-2026"), "2026-07-27"),
    false,
  );
  // 月曜休館: a closing day inside the run is not an occurrence, so the calendar
  // no longer counts a shut museum as somewhere you can go.
  assert.deepEqual(event("mie-art-rockefeller-flower-bird-prints-2026").closedWeekdays, [1]);
  assert.equal(
    eventOccursOn(event("mie-art-rockefeller-flower-bird-prints-2026"), "2026-07-20"),
    false,
  );

  assert.equal(
    eventOccursOn(event("kawage-summer-storytime-special-2026"), "2026-08-09"),
    true,
  );
  assert.equal(
    eventOccursOn(event("kawage-summer-storytime-special-2026"), "2026-08-10"),
    false,
  );

  assert.equal(
    eventOccursOn(event("asahi-library-job-experience-2026"), "2026-07-30"),
    true,
  );
  assert.equal(
    eventOccursOn(event("asahi-library-job-experience-2026"), "2026-08-18"),
    true,
  );
});

test("commercial-facility events stay tied to the facility registry", async () => {
  const facilitySources = JSON.parse(
    await readFile(new URL("../data/facility-sources.json", import.meta.url), "utf8"),
  );
  const registered = new Set(facilitySources.facilities.map((facility) => facility.name));
  const facilityEvents = payload.events.filter((event) => event.facility);

  assert.ok(facilityEvents.length > 0, "expected at least one facility event");

  for (const event of facilityEvents) {
    assert.ok(
      registered.has(event.facility.name),
      `${event.id} references an unregistered facility: ${event.facility.name}`,
    );
    // The tag drives the on-site filter, so it must not drift from the field.
    assert.ok(event.tags.includes("商業施設"), `${event.id} is missing the 商業施設 tag`);
  }

  // The reverse direction too: no event may claim the tag without the record.
  for (const event of payload.events) {
    if (event.tags.includes("商業施設")) {
      assert.ok(event.facility, `${event.id} is tagged 商業施設 but has no facility`);
    }
  }

  // Held-back candidates must carry a reason, so exclusions stay auditable.
  for (const facility of facilitySources.facilities) {
    for (const pending of facility.pending ?? []) {
      assert.ok(pending.title, `${facility.id} has a pending entry without a title`);
      assert.ok(pending.reason, `${facility.id} has a pending entry without a reason`);
    }
  }

  // The umbrella record must not coexist with the per-day records it was split into.
  const perDay = payload.events.filter((event) =>
    ["toin-slime-park-2026", "toin-weather-doctor-2026"].includes(event.id),
  );
  if (perDay.length > 0) {
    assert.equal(
      payload.events.find((event) => event.id === "toin-kids-summer-lab-2026"),
      undefined,
      "the キッズサマーラボ umbrella double-counts the per-day records",
    );
  }
});

test("date display is derived from the structured dates, not stored", async () => {
  const event = (id) => payload.events.find((item) => item.id === id);

  assert.deepEqual(formatEventDate(event("tsu-hanabi-2026")), { month: "7", day: "25" });

  // A run crossing a month boundary has to say so on both ends. "7–9月" over
  // "4–17" reads as the 4th to the 17th of one month.
  assert.deepEqual(formatEventDate(event("kuwana-ishidori-2026")), {
    month: "7–8",
    day: "7/31–8/2",
    span: { from: "7/31", to: "8/2" },
  });

  // Same for a recurring series: in "30・8・18" nothing says which month a day
  // belongs to, so the month is repeated whenever it changes.
  assert.deepEqual(formatEventDate(event("asahi-library-job-experience-2026")), {
    month: "7–8",
    day: "7/30・8/8・18",
  });

  // A series inside one month needs no repetition.
  assert.deepEqual(formatEventDate(event("kawage-summer-storytime-special-2026")), {
    month: "8",
    day: "2・9・23・30",
  });

  // A long series collapses to first–last so the date numeral stays legible.
  const pool = event("toin-bisshabisha-pool-2026");
  assert.ok(pool.dates.length > 5);
  assert.deepEqual(formatEventDate(pool), {
    month: "7–8",
    day: "7/25–8/16",
    span: { from: "7/25", to: "8/16" },
  });

  // The accessible name spells the dates out, since the visual block drops the
  // 月/日 markers and splits the range across elements.
  assert.equal(describeEventDate(event("tsu-hanabi-2026")), "7月25日");
  assert.equal(describeEventDate(event("kuwana-ishidori-2026")), "7月31日から8月2日まで");
  assert.equal(
    describeEventDate(event("asahi-library-job-experience-2026")),
    "7月30日・8月8日・8月18日",
  );

  // Nothing may render more than five day numbers in the card's date block.
  for (const item of payload.events) {
    const { day } = formatEventDate(item);
    assert.ok(
      day.split("・").length <= 5,
      `${item.id} renders too many day numbers: ${day}`,
    );
  }

  // No record may carry the old display-derived date fields any more.
  for (const item of payload.events) {
    assert.equal(item.month, undefined, `${item.id} still stores a display month`);
    assert.equal(item.day, undefined, `${item.id} still stores a display day`);
    assert.equal(item.period, undefined, `${item.id} still stores a hardcoded season`);
    assert.equal(item.isoDate, undefined, `${item.id} still stores isoDate`);
    assert.match(item.startDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(item.endDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(item.endDate >= item.startDate);
  }
});

test("municipal source registry covers all five East Kishu municipalities", async () => {
  const raw = await readFile(
    new URL("../data/municipal-sources.json", import.meta.url),
    "utf8",
  );
  const payload = JSON.parse(raw);
  const expected = new Set(["尾鷲市", "熊野市", "紀北町", "御浜町", "紀宝町"]);

  assert.equal(payload.municipalities.length, 5);
  assert.deepEqual(new Set(payload.municipalities.map((item) => item.name)), expected);

  for (const municipality of payload.municipalities) {
    assert.ok(municipality.sources.length > 0);
    for (const source of municipality.sources) assert.match(source.url, /^https:\/\//);
  }
});

test("small-event discovery sources stay separate from publishable event sources", async () => {
  const raw = await readFile(
    new URL("../data/discovery-sources.json", import.meta.url),
    "utf8",
  );
  const payload = JSON.parse(raw);

  assert.ok(payload.sources.length >= 28);
  assert.ok(payload.sources.some((source) => source.sourceType === "vendor_schedule"));
  assert.ok(payload.sources.some((source) => source.role === "signal"));
  assert.ok(payload.sources.some((source) => source.role === "confirmation"));

  for (const source of payload.sources) assert.match(source.url, /^https:\/\//);
});

test("festival watchlist fails closed until primary details are complete", async () => {
  const raw = await readFile(
    new URL("../data/festival-watchlist.json", import.meta.url),
    "utf8",
  );
  const payload = JSON.parse(raw);

  assert.ok(payload.candidates.length >= 14);
  assert.equal(
    payload.candidates.filter((candidate) => candidate.publishable !== false).length,
    0,
  );
  assert.ok(
    payload.candidates.some((candidate) => candidate.status === "source_conflict"),
  );
  assert.ok(
    payload.candidates.some(
      (candidate) => candidate.status === "needs_2026_confirmation",
    ),
  );

  for (const candidate of payload.candidates) {
    assert.match(candidate.expectedDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(candidate.nextCheckAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(candidate.childStatus, "unknown");
    for (const sourceUrl of candidate.sourceUrls) {
      assert.match(sourceUrl, /^https:\/\//);
    }
  }
});

test("kitchen-car experiment exposes only current calendars and keeps all candidates", async () => {
  const raw = await readFile(
    new URL("../data/kitchen-car-sources.json", import.meta.url),
    "utf8",
  );
  const payload = JSON.parse(raw);
  const current = payload.vehicles.filter(
    (source) => source.freshnessStatus === "current",
  );

  assert.equal(payload.featureStatus, "experimental");
  assert.equal(payload.adoptionStatus, "undecided");
  assert.equal(payload.vehicles.length, 15);
  assert.equal(current.length, 2);
  assert.deepEqual(
    new Set(current.map((source) => source.name)),
    new Set(["cafe＆crepe PECOCO", "Goofy BURGER"]),
  );
  assert.ok(payload.venueCalendars.length >= 4);

  for (const source of payload.vehicles) {
    assert.match(source.calendarUrl, /^https:\/\//);
    assert.match(source.lastCheckedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
});
