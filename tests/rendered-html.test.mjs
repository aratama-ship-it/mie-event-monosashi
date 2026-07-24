import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
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
  assert.match(html, /9月以降/);
  assert.doesNotMatch(html, /会場だけでは、拾いきれない。/);
  assert.doesNotMatch(html, /薄い地域ほど、先に見に行く。/);
  assert.doesNotMatch(html, /出店予定から、町の一日を逆引きする。/);
  assert.match(html, /ライブ、JFL、花火、展覧会…/);
  assert.match(html, /キッチンカーは、今日どこへ。/);
  assert.match(html, /使うかどうかは未定/);
  assert.match(html, /cafe＆crepe PECOCO/);
  assert.match(html, /Goofy BURGER/);
  assert.match(html, /現在表示 2台 \/ 調査候補 15台/);
  assert.match(html, /data-category="スポーツ"/);
  assert.match(html, /第108回 全国高校野球選手権三重大会 準々決勝/);
  assert.match(html, /JFL第1節 ヴィアティン三重 vs ボンズ市原/);
  assert.match(html, /東海社会人サッカーリーグ1部/);
  assert.match(html, /吉例マクサ夏祭り DAY-2「三重祭2026」/);
  assert.match(html, /Quubi Japan Tour 2026 三重公演/);
  assert.match(html, /ワンコインコンサート コントラバス 水野斗希/);
  assert.match(html, /GRe4N BOYZ イマーシブライブシアター2026/);
  assert.match(html, /第73回 おわせ港まつり/);
  assert.match(html, /2026年 熊野大花火大会/);
  assert.match(html, /第一次お木曳行事（川曳）— 二見/);
  assert.match(html, /第一次お木曳行事（川曳）— 宇治・二軒茶屋/);
  assert.match(html, /第一次お木曳行事（川曳）— 四郷/);
  assert.match(html, /第一次お木曳行事（川曳）— 大湊・修道/);
  assert.match(html, /かぶとの森の朝市（7月）/);
  assert.match(html, /野地町ビアガーデン2026/);
  assert.match(html, /亀山市納涼大会2026/);
  assert.match(html, /天文台「童夢」無料開放日・夏の星空観察会/);
  assert.match(html, /すずか夏祭り2026/);
  assert.match(html, /夏の鳥羽湾 毎夜連続花火/);
  assert.match(html, /第84回 名張川納涼花火大会/);
  assert.match(html, /陽夫多神社 祇園祭/);
  assert.match(html, /夜道を行けば～穐月明の夜の景色Ⅲ～/);
  assert.match(html, /大山田ふるさと夏祭り/);
  assert.match(html, /おもいっきり水あそび！/);
  assert.match(html, /人権啓発講演・映画「35年目のラブレター」上映会/);
  assert.match(html, /河芸図書館 夏休みおはなし会スペシャル/);
  assert.match(html, /ロックフェラー・コレクション花鳥版画展/);
  assert.match(html, /WHO ARE WE 観察と発見の生物学/);
  assert.match(html, /夏季企画展「王朝文学と斎王」/);
  assert.match(html, /ミニチュアドールハウスの世界展/);
  assert.match(html, /アルベール・マルケ展 水辺を愛した画家/);
  assert.match(html, /夏休みこども体験博物館2026/);
  assert.match(html, /図書館のお仕事体験/);
  assert.match(html, /園庭開放「保育所で遊びましょう」/);
  assert.match(html, /みんなで食堂（夏休み子ども食堂）/);
  assert.match(html, /いがオレンジカフェ／オレンジカフェあやま（8月）/);
  assert.match(html, /手づくり絵本教室「オリジナル絵本を作ってみよう！」/);
  assert.match(html, /員弁図書館 館内イベント「図書館ビンゴ」/);
  assert.match(html, /企画展「いなべにも戦争がありました」/);
  assert.match(html, /ロシアとおわせの文化交流/);
  assert.match(html, /子ども科学教室「入浴剤で作るよく飛ぶロケット！」/);
  assert.match(html, /ほんとカフェ＆夏のおたのしみ/);
  assert.match(html, /親子で楽しむはじめてのコンサート「おんがくことはじめ」/);
  assert.match(html, /初めてのお箏/);
  assert.match(html, /キッズお仕事広場「ボクの、ワタシの名刺をつくろう！」/);
  assert.match(html, /ものづくりフェアー2026/);
  assert.match(html, /フジさんのわくわく科学実験ショー/);
  assert.match(html, /みえこどもの城 de お盆を満喫！！/);
  assert.match(html, /イオンモール東員 キッズサマーラボ/);
  assert.match(html, /鈴鹿サーキット HANABI祭/);
  assert.match(html, /夏もベルファームであそぼう‼/);
  assert.match(html, /志摩スペイン村 サマーフィエスタ2026/);
  assert.match(html, /竹の水鉄砲作り【8\/16の部】/);
  assert.match(html, /第61回 全国高等専門学校体育大会 バレーボール競技/);
  assert.match(html, /恋旅in紀宝 vol.7/);
  assert.match(html, /ジュラシックアクアリウム/);
  assert.match(html, /data-category="交流"/);
  assert.match(html, /2026 きほく燈籠祭/);
  assert.match(html, /ジュン先生がやってきた！/);
  assert.match(html, /桑名石取祭 2026/);
  assert.match(html, /第63回 大四日市まつり/);
  assert.match(html, /令和8年度 四日市港まつり/);
  assert.match(html, /中部フィルハーモニー交響楽団 松阪特別演奏会/);
  assert.match(html, /錦花火大会/);
  assert.match(html, /でんじろう先生のドキドキわくわくサイエンスショー2026/);
  assert.match(html, /神無月＆ミラクルひかる 爆笑ものまねLIVE in三重/);
  assert.match(html, /愛洲氏顕彰祭・剣祖祭/);
  assert.match(html, /2026きほく夏祭り KODO/);
  assert.match(html, /data-category="展覧会"/);
  assert.match(html, /公式情報で最終確認/);
  assert.doesNotMatch(html, /codex-preview/);

  const eventCards = [...html.matchAll(/<article class="event-card"[\s\S]*?<\/article>/g)].map(
    (match) => match[0],
  );
  const cardFor = (title) => eventCards.find((card) => card.includes(title)) ?? "";

  assert.match(
    cardFor("三重ジュニア管弦楽団 こどもオーケストラ教室"),
    /data-child-fit="for-children"/,
  );
  assert.match(cardFor("第71回 鳥羽みなとまつり"), /data-child-fit="allowed"/);
  assert.match(cardFor("Quubi Japan Tour 2026 三重公演"), /data-child-fit="conditional"/);
  assert.match(cardFor("恋旅in紀宝 vol.7"), /data-child-fit="not-for-children"/);
  assert.match(cardFor("吉例マクサ夏祭り"), /data-child-fit="unknown"/);
});

test("all published records keep primary-source and sports-freshness fields", async () => {
  const raw = await readFile(new URL("../data/events.json", import.meta.url), "utf8");
  const payload = JSON.parse(raw);
  const sports = payload.events.filter((event) => event.category === "スポーツ");

  assert.equal(payload.events.length, 88);
  assert.equal(new Set(payload.events.map((event) => event.id)).size, 88);
  assert.equal(payload.events.filter((event) => event.category === "展覧会").length, 7);
  assert.equal(payload.events.filter((event) => event.category === "交流").length, 11);
  assert.equal(sports.length, 4);
  assert.deepEqual(
    payload.events
      .filter((event) => event.id.startsWith("ise-okihiki-kawabiki-"))
      .map((event) => event.isoDate)
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

  assert.equal(payload.sources.length, 16);
  assert.ok(payload.sources.some((source) => source.sourceType === "vendor_schedule"));
  assert.ok(payload.sources.some((source) => source.role === "signal"));
  assert.ok(payload.sources.some((source) => source.role === "confirmation"));

  for (const source of payload.sources) assert.match(source.url, /^https:\/\//);
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
