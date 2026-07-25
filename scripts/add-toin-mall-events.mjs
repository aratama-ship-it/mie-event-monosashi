/**
 * One-off: publish the first batch of shopping-mall events (イオンモール東員).
 *
 * Every record below was confirmed on 2026-07-25 against the mall's own event
 * detail page (one page per event, linked from https://toin.aeonmall.jp/event).
 * The listing page carries only a title and a date range, so times, fees,
 * targets and capacities all come from the individual detail pages.
 *
 * Two deliberate decisions:
 *
 * 1. `toin-kids-summer-lab-2026` is removed. It was an umbrella record for the
 *    8/10–8/14 series, and each of the five days is now its own record with its
 *    own fee, target and capacity — which is the point of the site. Keeping both
 *    would double-count the same days in the calendar.
 *
 * 2. Events whose official page does not state a target audience keep
 *    "公式に対象の記載なし" and carry no 子ども tag, so the child rating stays
 *    「公式で要確認」 rather than being guessed.
 *
 * Run once, from mock/:  node scripts/add-toin-mall-events.mjs
 */

import { readFile, writeFile } from "node:fs/promises";

const dataUrl = new URL("../data/events.json", import.meta.url);
const facility = { name: "イオンモール東員", type: "mall" };
const base = {
  region: "北勢",
  municipality: "東員町",
  status: "published",
  facility,
};
const source = (uuid, nextCheckAt) => ({
  kind: "primary",
  label: "イオンモール東員",
  url: `https://toin.aeonmall.jp/event/${uuid}`,
  verifiedAt: "2026-07-25",
  nextCheckAt,
});

/** 8/8–8/16 inclusive, used by the pool-play series. */
const range = (fromDay, toDay, month = "08") =>
  Array.from({ length: toDay - fromDay + 1 }, (_, index) =>
    `2026-${month}-${String(fromDay + index).padStart(2, "0")}`,
  );

const additions = [
  {
    ...base,
    id: "toin-hai-hai-contest-2026-07",
    startDate: "2026-07-27",
    endDate: "2026-07-27",
    dateNote: "月",
    time: "10:30／11:00／11:30の3回",
    category: "交流",
    title: "にこにこ笑顔溢れる ハイハイよちよちコンテスト【7月】",
    venue: "イオンモール東員 1階カブキコート",
    cost: "100円",
    audience: "はいはい・よちよち期のお子さまと保護者",
    summary:
      "はいはい・よちよち期の赤ちゃんが参加するコンテスト。各回10組で、イオンモールアプリのキッズクラブから予約でき、当日先着の枠もあります。",
    tags: ["屋内", "商業施設", "赤ちゃん", "要予約", "各回10組", "子ども"],
    source: source("ecf798e6-5623-448c-93d3-f87a206fb43e", "2026-07-26"),
  },
  {
    ...base,
    id: "toin-seiha-english-play-2026-08",
    startDate: "2026-08-04",
    endDate: "2026-08-04",
    dateNote: "火",
    time: "10:30–11:00",
    category: "学び",
    title: "【セイハ英語学院】0歳から3歳の えいごあそび 8月",
    venue: "イオンモール東員 3階ジョイフルパーク2",
    cost: "無料",
    audience: "0歳から3歳までのお子さまと保護者",
    summary:
      "英語の絵本の読み聞かせと歌・ダンスで遊ぶ催し。8月は海の生き物がテーマです。予約は不要です。",
    tags: ["屋内", "商業施設", "無料", "申込不要", "英語", "子ども"],
    source: source("4a8ff7a3-ffd2-4ae9-9cc1-915e3812abcc", "2026-08-03"),
  },
  {
    ...base,
    id: "toin-obakenu-2026",
    startDate: "2026-08-08",
    endDate: "2026-08-09",
    dateNote: "土・日",
    time: "やしき 10:00–17:00（最終入場16:50）／グリーティング 11:00・13:00・15:00",
    category: "交流",
    title: "＼どろどろ～ん／オバケーヌやしき！＆オバケーヌがやってくる！",
    venue: "イオンモール東員 1階カブキコート・2階ジョイフルコート",
    cost: "やしき 1人200円（税込／キッズクラブ会員は100円引）、グリーティングは無料",
    audience: "お子さま向け（保護者の同伴可）",
    summary:
      "1階のおばけやしきと、2階のキャラクターグリーティングの二本立て。グリーティングは各回30分で整理券の配布はありません。",
    tags: ["屋内", "商業施設", "キャラクター", "申込不要", "子ども"],
    source: source("66460229-0ced-48bb-acbf-17ea1ae49ed7", "2026-08-07"),
  },
  {
    ...base,
    id: "toin-slime-park-2026",
    startDate: "2026-08-10",
    endDate: "2026-08-10",
    dateNote: "月",
    time: "11:00–17:00（整理券は10:00から配布）",
    category: "学び",
    title: "スライムパーク！",
    venue: "イオンモール東員 1階カブキコート",
    cost: "500円（税込・現金のみ）",
    audience: "小学生以下のお子さま",
    summary:
      "キッズサマーラボの初日。スライムづくりを体験できます。定員100人で、定員に達し次第終了します。",
    tags: ["屋内", "商業施設", "夏休み", "自由研究", "定員100人", "子ども"],
    source: source("54c9d5c1-0834-4024-ad5b-da0b58a31994", "2026-08-09"),
  },
  {
    ...base,
    id: "toin-nagashi-somen-stand-2026",
    startDate: "2026-08-11",
    endDate: "2026-08-11",
    dateNote: "火",
    time: "11:00–17:00（整理券は10:00から配布）",
    category: "学び",
    title: "流しそうめん台づくり",
    venue: "イオンモール東員 1階カブキコート",
    cost: "500円（税込・現金のみ）",
    audience: "小学生以下のお子さま",
    summary:
      "キッズサマーラボの2日目。流しそうめんの台を工作します。定員100人で、定員に達し次第終了します。",
    tags: ["屋内", "商業施設", "夏休み", "工作", "定員100人", "子ども"],
    source: source("80c02d0e-77a4-4f99-94b5-b28e9b52ce10", "2026-08-10"),
  },
  {
    ...base,
    id: "toin-planetarium-3d-2026",
    startDate: "2026-08-12",
    endDate: "2026-08-12",
    dateNote: "水",
    time: "11:00–17:00",
    category: "学び",
    title: "プラネタリウムとびっくり3D体験！",
    venue: "イオンモール東員 1階カブキコート",
    cost: "無料",
    audience: "どなたでも参加できます",
    summary:
      "キッズサマーラボの3日目。プラネタリウムと3D映像を体験できます。定員は約200人で、先着順です。",
    tags: ["屋内", "商業施設", "無料", "夏休み", "先着順", "定員約200人"],
    source: source("4e414a6b-13d6-4b1f-8c67-f57f5905b110", "2026-08-11"),
  },
  {
    ...base,
    id: "toin-kids-survival-2026",
    startDate: "2026-08-13",
    endDate: "2026-08-13",
    dateNote: "木",
    time: "11:00–17:00（整理券は10:00から配布）",
    category: "学び",
    title: "キッズサバイバル教室",
    venue: "イオンモール東員 1階カブキコート",
    cost: "無料",
    audience: "小学生以下のお子さま",
    summary:
      "キッズサマーラボの4日目。防犯ブザーの音量や使い方を確かめながら、身を守る方法を体験して学びます。定員100人・先着順です。",
    tags: ["屋内", "商業施設", "無料", "夏休み", "防災", "定員100人", "子ども"],
    source: source("e896d730-a865-4a72-8a4b-464d50bcada1", "2026-08-12"),
  },
  {
    ...base,
    id: "toin-weather-doctor-2026",
    startDate: "2026-08-14",
    endDate: "2026-08-14",
    dateNote: "金",
    time: "11:00–17:00（整理券は10:00から配布）",
    category: "学び",
    title: "お天気博士になろう！",
    venue: "イオンモール東員 1階カブキコート",
    cost: "500円（税込・現金のみ）",
    audience: "小学生以下のお子さま",
    summary:
      "キッズサマーラボの最終日。ペットボトルの中に雲をつくる実験で天気のしくみを学びます。定員100人で、自由研究にも使えます。",
    tags: ["屋内", "商業施設", "夏休み", "自由研究", "定員100人", "子ども"],
    source: source("7c9915cc-7523-4ba5-9f9c-406ac8bfc3ce", "2026-08-13"),
  },
  {
    ...base,
    id: "toin-perupins-live-2026",
    startDate: "2026-08-15",
    endDate: "2026-08-15",
    dateNote: "土",
    time: "11:00／13:30／16:00の3回",
    category: "音楽",
    title: "ペルピンズSPライブ＆特典会",
    venue: "イオンモール東員 1階カブキコート",
    cost: "観覧無料（特典会は対象商品の購入などが必要）",
    audience: "どなたでも観覧できます（着席は整理券制）",
    summary:
      "3回入れ替えのライブ。着席エリアは各回30枚の整理券制で、当日9:30から会場で配布されます。立ち見での観覧は自由です。",
    tags: ["屋内", "商業施設", "ライブ", "観覧無料", "整理券", "各回30枚"],
    source: source("79fcf7a5-a0f5-4b8d-82b7-8e5524f89153", "2026-08-14"),
  },
  {
    ...base,
    id: "toin-kuromi-stage-2026",
    startDate: "2026-08-16",
    endDate: "2026-08-16",
    dateNote: "日",
    time: "ショー 11:00・15:00／撮影会 13:00",
    category: "舞台",
    title: "クロミ・ザ・ステージ",
    venue: "イオンモール東員 1階カブキコート",
    cost: "観覧無料",
    audience: "どなたでも観覧できます（3歳未満は保護者の膝上で観覧可）",
    summary:
      "ショー2回と撮影会1回。各回40組（1組5人まで）の整理券制で、当日8:45から1階ガーデンプレイスで配布されます。",
    tags: ["屋内", "商業施設", "観覧無料", "キャラクター", "整理券", "各回40組"],
    source: source("2b32faf4-1707-44d1-9456-0816ac93f147", "2026-08-15"),
  },
  {
    ...base,
    id: "toin-water-sabage-2026",
    startDate: "2026-08-22",
    endDate: "2026-08-23",
    dateNote: "土・日",
    time: "10:30／11:00／11:30／12:15／12:45／14:15／14:45／15:15（受付10:00・1回約15分）",
    category: "交流",
    title: "ウォーターサバゲー in イオンモール東員",
    venue: "イオンモール東員 ガーデンプレイス",
    cost: "無料",
    audience: "個人・家族で参加可（小学生以下は肘・膝プロテクターの着用が必要）",
    summary:
      "水鉄砲を使ったチーム戦。受付でチーム分けをします。1チーム15人で、各回の定員に達し次第受付を終了します。",
    tags: ["屋外", "商業施設", "無料", "水あそび", "定員あり", "子ども"],
    source: source("82323dca-b756-4a9a-b7f9-f4dc70551f0e", "2026-08-21"),
  },
  {
    ...base,
    id: "toin-taiko-fishing-2026",
    startDate: "2026-08-23",
    endDate: "2026-08-23",
    dateNote: "日",
    time: "11:00–17:00",
    category: "交流",
    title: "太鼓の達人＆釣りスピリッツを体験してみよう！",
    venue: "イオンモール東員 1階カブキコート",
    cost: "無料",
    audience: "公式に対象の記載なし",
    summary:
      "アーケードゲームの体験コーナー。プラ板キーホルダーづくりも併催されます。対象年齢は公式に記載がありません。",
    tags: ["屋内", "商業施設", "無料", "ゲーム"],
    source: source("4eabfc78-312b-4fc0-8050-2d41f7851416", "2026-08-22"),
  },
  {
    ...base,
    id: "toin-tekken8-battle-2026",
    startDate: "2026-08-30",
    endDate: "2026-08-30",
    dateNote: "日",
    time: "10:00–15:00",
    category: "交流",
    title: "鉄拳8 サマーバトル体験会",
    venue: "イオンモール東員 1階カブキコート",
    cost: "無料",
    audience: "どなたでも参加できます（初心者も可）",
    summary:
      "対戦格闘ゲームの体験会。プロ選手が来場予定で、初めての人にはスタッフが操作を案内します。",
    tags: ["屋内", "商業施設", "無料", "ゲーム", "初心者可"],
    source: source("329aa14b-9042-46db-978a-fa0b0f5cceac", "2026-08-29"),
  },
  {
    ...base,
    id: "toin-bisshabisha-pool-2026",
    startDate: "2026-07-25",
    endDate: "2026-08-16",
    dates: ["2026-07-25", "2026-07-26", "2026-08-01", "2026-08-02", ...range(8, 16)],
    dateNote: "土日と8/8–16",
    time: "10:00–16:00",
    category: "交流",
    title: "ビッシャビシャ プールあそび！",
    venue: "イオンモール東員 ガーデンプレイス",
    cost: "無料",
    audience: "3歳から6歳のお子さま（2歳以下は芝生エリアで遊べます）",
    summary:
      "屋外のプールあそび。おむつが外れていないお子さまはプールに入れません。混雑時は入水を10分交代に区切って運用されます。",
    tags: ["屋外", "商業施設", "無料", "水あそび", "熱中症注意", "子ども"],
    source: source("b485e1ad-6ecd-4eba-a044-6a8edaf9ba2b", "2026-07-31"),
  },
  {
    ...base,
    id: "toin-mini-pool-2026",
    startDate: "2026-08-22",
    endDate: "2026-08-30",
    dates: ["2026-08-22", "2026-08-23", "2026-08-29", "2026-08-30"],
    dateNote: "土・日",
    time: "10:00–16:00",
    category: "交流",
    title: "ミニプール遊び！",
    venue: "イオンモール東員 ガーデンプレイス",
    cost: "無料",
    audience: "6歳以下のお子さま",
    summary:
      "ミニプールと魚のおもちゃすくいで遊べます。プールの中には入れません。暑さ対策として水分補給と休憩の案内があります。",
    tags: ["屋外", "商業施設", "無料", "水あそび", "熱中症注意", "子ども"],
    source: source("57165786-8a24-4787-ae74-18f2189b1eff", "2026-08-21"),
  },
];

const payload = JSON.parse(await readFile(dataUrl, "utf8"));

// The umbrella record is superseded by the five per-day records.
const umbrellaIndex = payload.events.findIndex(
  (event) => event.id === "toin-kids-summer-lab-2026",
);
if (umbrellaIndex >= 0) {
  payload.events.splice(umbrellaIndex, 1);
  console.log("removed umbrella record toin-kids-summer-lab-2026");
}

// Backfill the facility on the mall event that predates this field.
const suzuka = payload.events.find((event) => event.id === "suzuka-monozukuri-fair-2026");
if (suzuka && !suzuka.facility) {
  suzuka.facility = { name: "イオンモール鈴鹿", type: "mall" };
  if (!suzuka.tags.includes("商業施設")) suzuka.tags.push("商業施設");
  console.log("backfilled facility on suzuka-monozukuri-fair-2026");
}

const existingIds = new Set(payload.events.map((event) => event.id));
let added = 0;
for (const event of additions) {
  if (existingIds.has(event.id)) {
    console.log(`skip (already present): ${event.id}`);
    continue;
  }
  payload.events.push(event);
  added += 1;
}

payload.events.sort((left, right) => left.startDate.localeCompare(right.startDate));
payload.updatedAt = "2026-07-25";
await writeFile(dataUrl, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(`added ${added} mall events; total is now ${payload.events.length}`);
