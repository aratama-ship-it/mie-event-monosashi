/**
 * One-off: publish shopping-mall events for the remaining five malls plus VISON.
 *
 * Confirmed 2026-07-25. Sources by system (see data/facility-sources.json):
 *
 *   イオンモール明和 / 四日市北 / 桑名   www.aeon.jp/sc/<name>/event/index.json
 *       Carries display_event_date / _time / _place and the full body, so dates,
 *       times, fees, targets and capacities all come from the mall's own data.
 *       CAUTION: structured_start_date / structured_end_date disagree with
 *       display_event_date on several records, so display_event_date is used.
 *   イオンモール鈴鹿 / 津南             <name>.aeonmall.jp/event/<uuid>
 *       Detail pages are JS-rendered; each record below was read individually.
 *   VISON                              vison.jp/eventcalendar/detail.php?id=<n>
 *       Static detail pages with 開催時間 / 参加料金 / 定員.
 *
 * Events whose official page does not state a fee or a target keep
 * "…は公式情報で確認" / "公式に対象の記載なし" and no 子ども tag, so nothing is
 * guessed and the child rating stays 「公式で要確認」.
 *
 * Run once, from mock/:  node scripts/add-mall-events-round2.mjs
 */

import { readFile, writeFile } from "node:fs/promises";

const dataUrl = new URL("../data/events.json", import.meta.url);

const mall = (name) => ({ name, type: "mall" });
const src = (label, url, nextCheckAt) => ({
  kind: "primary",
  label,
  url,
  verifiedAt: "2026-07-25",
  nextCheckAt,
});
const aeonJp = (slug, file) => `https://www.aeon.jp/sc/${slug}/event/${file}`;

// ---------------------------------------------------------------- イオンモール明和
const meiwa = {
  region: "伊勢志摩",
  municipality: "明和町",
  status: "published",
  facility: mall("イオンモール明和"),
};
const meiwaSrc = (file, nextCheckAt) =>
  src("イオンモール明和", aeonJp("meiwa", file), nextCheckAt);

// ------------------------------------------------------------ イオンモール四日市北
const yokkaichikita = {
  region: "北勢",
  municipality: "四日市市",
  status: "published",
  facility: mall("イオンモール四日市北"),
};
const ykSrc = (file, nextCheckAt) =>
  src("イオンモール四日市北", aeonJp("yokkaichikita", file), nextCheckAt);

// ---------------------------------------------------------------- イオンモール桑名
const kuwana = {
  region: "北勢",
  municipality: "桑名市",
  status: "published",
  facility: mall("イオンモール桑名"),
};
const kuwanaSrc = (file, nextCheckAt) =>
  src("イオンモール桑名", aeonJp("kuwana", file), nextCheckAt);

// ---------------------------------------------------------------- イオンモール鈴鹿
const suzuka = {
  region: "北勢",
  municipality: "鈴鹿市",
  status: "published",
  facility: mall("イオンモール鈴鹿"),
};
const suzukaSrc = (uuid, nextCheckAt) =>
  src("イオンモール鈴鹿", `https://suzuka.aeonmall.jp/event/${uuid}`, nextCheckAt);

// ---------------------------------------------------------------- イオンモール津南
const tsuminami = {
  region: "中勢",
  municipality: "津市",
  status: "published",
  facility: mall("イオンモール津南"),
};
const tsuSrc = (uuid, nextCheckAt) =>
  src("イオンモール津南", `https://tsuminami.aeonmall.jp/event/${uuid}`, nextCheckAt);

// ------------------------------------------------------------------------- VISON
const vison = {
  region: "中勢",
  municipality: "多気町",
  status: "published",
  facility: { name: "VISON", type: "commercial_resort" },
};
const visonSrc = (id, nextCheckAt) =>
  src("VISON", `https://vison.jp/eventcalendar/detail.php?id=${id}`, nextCheckAt);

const additions = [
  // ============================================================ イオンモール明和
  {
    ...meiwa,
    id: "meiwa-manten-yoichi-2026",
    startDate: "2026-07-25",
    endDate: "2026-07-25",
    dateNote: "土",
    time: "16:00–21:30",
    category: "祭り",
    title: "満天夜市 〜屋上遊園地編〜",
    venue: "イオンモール明和 3F屋上駐車場（イオン明和店屋上）",
    cost: "料金は公式情報で確認",
    audience: "家族向け（ふわふわ遊具・お化け屋敷・縁日あり）",
    summary:
      "大淀祇園祭の花火大会に合わせて屋上駐車場を開放。夜市グルメ、ふわふわ遊具、お化け屋敷、縁日、ステージ、スポーツ体験教室があります。当日は屋上に駐車できません。",
    tags: ["屋外", "商業施設", "花火", "夜", "縁日", "子ども"],
    source: meiwaSrc("event_e86986_as.html", "2026-07-25"),
  },
  {
    ...meiwa,
    id: "meiwa-poipoi-battler-2026",
    startDate: "2026-07-26",
    endDate: "2026-08-15",
    dates: ["2026-07-26", "2026-08-15"],
    dateNote: "日・土",
    time: "11:00–17:00",
    category: "交流",
    title: "夏の親子ウォーターバトル！ポイポイバトラー",
    venue: "イオンモール明和 シネマ棟屋上（雨天中止）",
    cost: "1名300円（税込・現金のみ）",
    audience: "小学生、または未就学児と保護者",
    summary:
      "ゴーグルに付けた金魚すくいの「ポイ」を水鉄砲でねらうチーム戦。スタッフがルール説明と練習時間を用意し、チーム分けも手伝います。",
    tags: ["屋外", "商業施設", "水あそび", "親子", "雨天中止"],
    source: meiwaSrc("event_e83678_as.html", "2026-07-25"),
  },
  {
    ...meiwa,
    id: "meiwa-classic-live-2026",
    startDate: "2026-07-26",
    endDate: "2026-07-26",
    dateNote: "日",
    time: "(1)14:00–14:30 (2)16:00–16:30",
    category: "音楽",
    title: "100万人のクラシックライブ",
    venue: "イオンモール明和 1F ハナショウブの広場",
    cost: "料金は公式情報で確認",
    audience: "公式に対象の記載なし",
    summary:
      "ヴァイオリンとピアノによる30分のミニライブを2回。演奏家の話を交えて進みます。内容は予告なく変更となる場合があります。",
    tags: ["屋内", "商業施設", "クラシック", "ミニライブ"],
    source: meiwaSrc("event_e83515_as.html", "2026-07-25"),
  },
  {
    ...meiwa,
    id: "meiwa-dino-water-shooting-2026",
    startDate: "2026-08-01",
    endDate: "2026-08-01",
    dateNote: "土",
    time: "11:00–15:00（各回20分・全8回）",
    category: "交流",
    title: "恐竜ウォーターシューティング",
    venue: "イオンモール明和 シネマ棟屋上（雨天中止）",
    cost: "参加費は公式情報で確認",
    audience: "4歳から小学生のみ",
    summary:
      "的を付けた恐竜を水鉄砲でねらいます。恐竜は逃げ回り、水で反撃してくることも。各回定員20名です。雨天の場合は8月22日に延期されます。",
    tags: ["屋外", "商業施設", "水あそび", "各回20名", "雨天順延", "子ども"],
    source: meiwaSrc("event_e82056_as.html", "2026-07-31"),
  },
  {
    ...meiwa,
    id: "meiwa-temochi-hanabi-2026",
    startDate: "2026-08-02",
    endDate: "2026-08-09",
    dates: ["2026-08-02", "2026-08-09"],
    dateNote: "日",
    time: "16:00–20:00",
    category: "交流",
    title: "イオンモール明和の屋上で手持ち花火を楽しもう！",
    venue: "イオンモール明和 シネマ棟屋上（雨天中止）",
    cost: "期間中の専門店お買い上げレシート税込500円以上で手持ち花火をプレゼント",
    audience: "小学生以下のお子さまとその保護者",
    summary:
      "シネマ棟屋上で手持ち花火ができます。各日先着130名で、1人1回限りです。天候により早めに終了する場合があります。",
    tags: ["屋外", "商業施設", "花火", "夜", "各日先着130名", "子ども"],
    source: meiwaSrc("event_e86017_as.html", "2026-08-01"),
  },
  {
    ...meiwa,
    id: "meiwa-obon-odori-2026",
    startDate: "2026-08-08",
    endDate: "2026-08-08",
    dateNote: "土",
    time: "17:00–21:30",
    category: "祭り",
    title: "第3回 めいわ大盆踊りまつり",
    venue: "イオンモール明和 1F 平面北側駐車場",
    cost: "料金は公式情報で確認",
    audience: "家族向け（防災コーナー・縁日・お菓子まきあり）",
    summary:
      "明和音頭保存会のレクチャーのあと20:00まで盆踊り。太鼓演奏、防災コーナー、縁日、キッチンカー、お菓子まき、大抽選会があります。主催はめいわ大盆踊りまつり実行委員会です。",
    tags: ["屋外", "商業施設", "盆踊り", "夜", "縁日", "子ども"],
    source: meiwaSrc("event_e86987_as.html", "2026-08-07"),
  },
  {
    ...meiwa,
    id: "meiwa-ikimono-dojo-2026",
    startDate: "2026-08-08",
    endDate: "2026-08-09",
    dateNote: "土・日",
    time: "10:00–16:00（各回定員制・全5回）",
    category: "学び",
    title: "いきもの道場 ウーパールーパー道場",
    venue: "イオンモール明和 1F ハナショウブの広場",
    cost: "お子さま500円（税込／2歳以下無料）、大人200円（税込・高校生以上）",
    audience: "お子さま向け（未就学児は高校生以上の保護者同伴が必要）",
    summary:
      "ウーパールーパーの「えら」などの特徴と生態を、親子で学べる40分の体験。付き添いの人も参加料金が必要です。",
    tags: ["屋内", "商業施設", "いきもの", "定員制", "親子", "子ども"],
    source: meiwaSrc("event_e83650_as.html", "2026-08-07"),
  },
  {
    ...meiwa,
    id: "meiwa-sweets-deco-parfait-2026",
    startDate: "2026-08-11",
    endDate: "2026-08-11",
    dateNote: "火",
    time: "10:30／12:00／13:30／15:00の4回",
    category: "学び",
    title: "スイーツデコ リアルサイズのアイスパフェをつくろう!!",
    venue: "イオンモール明和 1F ハナショウブの広場",
    cost: "一般300円（税込・材料費込）、イオンモールアプリ キッズクラブ会員200円（税込）",
    audience: "お子さま向け（公式に年齢の下限記載なし）",
    summary:
      "スイーツデコのパーツでリアルサイズのアイスパフェをつくります。各回先着25名・合計100名。事前予約はアプリのキッズクラブから8月1日10:00に開始します。",
    tags: ["屋内", "商業施設", "工作", "要予約", "各回25名", "子ども"],
    source: meiwaSrc("event_e79243_as.html", "2026-08-10"),
  },
  {
    ...meiwa,
    id: "meiwa-rilakkuma-photo-2026",
    startDate: "2026-08-13",
    endDate: "2026-08-14",
    dateNote: "木・金",
    time: "11:00／13:00／15:00の3回",
    category: "交流",
    title: "リラックマがやってくる！ 撮影会",
    venue: "イオンモール明和 1F ハナショウブの広場",
    cost: "参加無料",
    audience: "どなたでも参加できます",
    summary:
      "各回先着40組の撮影会。当日10:00からモール北入口外で全ての回の整理券を配布し、残っていれば10:15からハナショウブの広場でも配布します。整理券は1組1枚です。",
    tags: ["屋内", "商業施設", "無料", "キャラクター", "整理券", "各回40組"],
    source: meiwaSrc("event_e87133_as.html", "2026-08-12"),
  },
  {
    ...meiwa,
    id: "meiwa-opanchu-usagi-2026",
    startDate: "2026-08-16",
    endDate: "2026-08-16",
    dateNote: "日",
    time: "10:00–17:00",
    category: "交流",
    title: "おぱんちゅうさぎ「はい！ち〜ぢゅ！」",
    venue: "イオンモール明和 1F ハナショウブの広場",
    cost: "参加無料",
    audience: "どなたでも参加できます",
    summary:
      "撮影会と、館内をまわるARラリー。整理券は朝9:30からモール北入口で配布し、撮影会参加券は各回先着50組×3回（1組4名まで）、ARラリー景品引換券は先着300名です。",
    tags: ["屋内", "商業施設", "無料", "キャラクター", "整理券", "ARラリー"],
    source: meiwaSrc("event_e84059_as.html", "2026-08-15"),
  },

  // ======================================================== イオンモール四日市北
  {
    ...yokkaichikita,
    id: "yokkaichikita-dental-poster-2026",
    startDate: "2026-07-22",
    endDate: "2026-07-30",
    dateNote: "期間中",
    time: "10:00–21:00",
    category: "展覧会",
    title: "歯科医師会 図画・ポスターコンクール入賞作品展示",
    venue: "イオンモール四日市北 1階ペテモ前",
    cost: "料金は公式情報で確認",
    audience: "公式に対象の記載なし",
    summary: "歯科医師会の図画・ポスターコンクールの入賞作品を展示します。",
    tags: ["屋内", "商業施設", "展示", "こどもの作品"],
    source: ykSrc("event_e86002_as.html", "2026-07-29"),
  },
  {
    ...yokkaichikita,
    id: "yokkaichikita-dino-water-shooting-2026",
    startDate: "2026-07-26",
    endDate: "2026-07-26",
    dateNote: "日",
    time: "11:00–15:50（各回20分・全10回）",
    category: "交流",
    title: "恐竜ウォーターシューティング",
    venue: "イオンモール四日市北 ディオワールド側特設会場",
    cost: "参加費は公式情報で確認",
    audience: "公式に対象の記載なし",
    summary:
      "逃げ回って反撃してくる恐竜を水鉄砲でねらいます。各回20名限定で、当日10:00に全ての回の整理券を配布します。雨天時は8月2日に延期されます。",
    tags: ["屋外", "商業施設", "水あそび", "各回20名", "雨天順延"],
    source: ykSrc("event_e86004_as.html", "2026-07-25"),
  },
  {
    ...yokkaichikita,
    id: "yokkaichikita-furima-2026-08",
    startDate: "2026-08-08",
    endDate: "2026-08-09",
    dateNote: "土・日",
    time: "10:00–15:00",
    category: "交流",
    title: "イオンモール四日市北フリマ",
    venue: "イオンモール四日市北 ディオワールド前屋外会場",
    cost: "料金は公式情報で確認",
    audience: "公式に対象の記載なし",
    summary:
      "屋外会場でのフリーマーケット。主催は三重県フリマ倶楽部です。雨天中止で、状況により早めに終了する場合があります。",
    tags: ["屋外", "商業施設", "フリーマーケット", "雨天中止"],
    source: ykSrc("event_e77723_as.html", "2026-08-07"),
  },
  {
    ...yokkaichikita,
    id: "yokkaichikita-kenketsu-2026-08",
    startDate: "2026-08-09",
    endDate: "2026-08-09",
    dateNote: "日",
    time: "10:00–11:30／13:00–16:00",
    category: "交流",
    title: "献血のお知らせ",
    venue: "イオンモール四日市北 1階ペテモ前",
    cost: "無料",
    audience: "男性17歳・女性18歳から、体重50kg以上の方",
    summary: "館内での献血。午前と午後の2枠で受け付けます。",
    tags: ["屋内", "商業施設", "献血", "無料"],
    source: ykSrc("event_e49024_as.html", "2026-08-08"),
  },
  {
    ...yokkaichikita,
    id: "yokkaichikita-hoshi-2026",
    startDate: "2026-08-11",
    endDate: "2026-08-11",
    dateNote: "火",
    time: "10:00–15:00／18:30–20:00",
    category: "学び",
    title: "親子で星を楽しもう",
    venue: "イオンモール四日市北 1階エスカレーター前・レンガ棟前",
    cost: "星のストラップ工作は税込500円、移動式プラネタリウムは無料",
    audience: "親子向け（小学生以下は保護者同伴）",
    summary:
      "3つの企画。星のストラップ工作は先着100名。移動式プラネタリウムは1回約30分で10:00〜15:00に全6回、各回約25名で無料。夜は移動天文車「きらら号」の観望会が18:30から外のレンガ棟前であります。",
    tags: ["屋内外", "商業施設", "天体", "工作", "先着順", "親子", "子ども"],
    source: ykSrc("event_e87090_as.html", "2026-08-10"),
  },
  {
    ...yokkaichikita,
    id: "yokkaichikita-mini4wd-2026",
    startDate: "2026-08-14",
    endDate: "2026-08-14",
    dateNote: "金",
    time: "工作 10:30／13:00／15:00",
    category: "学び",
    title: "ミニ四駆 工作・走行体験",
    venue: "イオンモール四日市北 1階エスカレーター前",
    cost: "工作は1人1,000円（税込／キッズクラブクーポン使用で800円）",
    audience: "工作は小学生以下のお子さま（保護者同伴）、走行体験はすべてのお客さま",
    summary:
      "工作体験は各回定員10名で、8月8日10:00からイオンモールアプリのキッズクラブで予約を受け付けます。10分遅れるとキャンセルになります。走行体験は各回50名で、小学生以下が優先される場合があります。",
    tags: ["屋内", "商業施設", "工作", "要予約", "各回10名", "子ども"],
    source: ykSrc("event_e87154_as.html", "2026-08-13"),
  },
  {
    ...yokkaichikita,
    id: "yokkaichikita-yasai-shukaku-2026",
    startDate: "2026-08-16",
    endDate: "2026-08-16",
    dateNote: "日",
    time: "時間は公式情報で確認",
    category: "学び",
    title: "大きな畑に入って！〜 野菜の収穫体験 〜",
    venue: "イオンモール四日市北 1階エスカレーター前",
    cost: "参加費は公式情報で確認",
    audience: "お子さま向け（長靴と軍手を着用します）",
    summary:
      "擬似畑にじゃがいも・にんじん・玉ねぎが埋まっていて、土に触りながら宝探しのように収穫します。収穫した野菜は一定量を持ち帰れます。",
    tags: ["屋内", "商業施設", "収穫体験", "食育", "子ども"],
    source: ykSrc("event_e83791_as.html", "2026-08-15"),
  },

  // ============================================================ イオンモール桑名
  {
    ...kuwana,
    id: "kuwana-banksy-print-2026",
    startDate: "2026-07-17",
    endDate: "2026-07-27",
    dateNote: "期間中",
    time: "11:00–19:00（最終日16:00閉場）",
    category: "展覧会",
    title: "バンクシーと人気アート作家版画展",
    venue: "イオンモール桑名 1番街2階 GILD前",
    cost: "入場料無料（展示販売）",
    audience: "公式に対象の記載なし",
    summary:
      "英国ウエスト・カントリー・プリンスが制作したバンクシーのリプロダクション版画を中心に約30点。ミスターブレインウォッシュなどの作品も並びます。",
    tags: ["屋内", "商業施設", "無料", "版画", "アート"],
    source: kuwanaSrc("event_e79967_as.html", "2026-07-26"),
  },
  {
    ...kuwana,
    id: "kuwana-gel-candle-2026",
    startDate: "2026-07-26",
    endDate: "2026-07-26",
    dateNote: "日",
    time: "10:30／12:00／13:30／15:00の4回",
    category: "学び",
    title: "サマージェルキャンドルをつくろう",
    venue: "イオンモール桑名 1番街2F 東出入口前 会場",
    cost: "イオンモールアプリ提示で税込200円",
    audience: "小学生以下のお子さま限定",
    summary:
      "キラキラストーンや貝殻で夏のジェルキャンドルをつくります。ジェルが固まるまでミニチュアドリンクカップのキーホルダーもつくれます。定員は合計50名で、当日10:00から会場で整理券を配布します。アプリからの事前予約はありません。",
    tags: ["屋内", "商業施設", "工作", "整理券", "定員50名", "子ども"],
    source: kuwanaSrc("event_e80750_as.html", "2026-07-25"),
  },
  {
    ...kuwana,
    id: "kuwana-studio-xiana-2026",
    startDate: "2026-07-26",
    endDate: "2026-07-26",
    dateNote: "日",
    time: "(1)13:15 (2)15:15",
    category: "舞台",
    title: "【ドキドキ発表会】スタジオXiANA",
    venue: "イオンモール桑名 1番街1階 噴水の広場",
    cost: "料金は公式情報で確認",
    audience: "公式に対象の記載なし",
    summary: "K-POPに合わせた足のステップ中心のダンス発表会を2回行います。",
    tags: ["屋内", "商業施設", "ダンス", "発表会"],
    source: kuwanaSrc("event_e84574_as.html", "2026-07-25"),
  },
  {
    ...kuwana,
    id: "kuwana-illustrators-fes-2026",
    startDate: "2026-07-31",
    endDate: "2026-08-03",
    dateNote: "期間中",
    time: "10:00–18:00（初日13:00〜）",
    category: "展覧会",
    title: "イラストレーターズフェスティバル",
    venue: "イオンモール桑名 1番街2階 GILD前特設会場",
    cost: "料金は公式情報で確認",
    audience: "公式に対象の記載なし",
    summary:
      "複数のアーティストによるイラスト版画の展示。最終日は17:00まで。混雑時は入場制限や入場整理券の配布があり、入場時にアンケートの協力を求められます。",
    tags: ["屋内", "商業施設", "イラスト", "アート"],
    source: kuwanaSrc("event_e85687_as.html", "2026-07-30"),
  },
  {
    ...kuwana,
    id: "kuwana-calbee-oyatsu-2026",
    startDate: "2026-08-11",
    endDate: "2026-08-11",
    dateNote: "火",
    time: "10:30／12:30／14:30（各30分）",
    category: "学び",
    title: "イオンモール × カルビー おやつの食べ方教室",
    venue: "イオンモール桑名 1番街2F GILD前特設会場",
    cost: "参加費は公式情報で確認（参加賞あり）",
    audience: "推奨の参加年齢は4歳以上（親子向け）",
    summary:
      "1日のおやつの量や食べる時間を学び、ポテトチップスができるまでの映像を見ます。カルビーのキャラクターも来場します。各回30名（事前予約15名・当日先着15名）で、事前予約はキッズクラブから8月4日10:00開始です。",
    tags: ["屋内", "商業施設", "食育", "要予約", "各回30名", "親子", "子ども"],
    source: kuwanaSrc("event_e85685_as.html", "2026-08-10"),
  },
  {
    ...kuwana,
    id: "kuwana-sweets-deco-house-2026",
    startDate: "2026-08-15",
    endDate: "2026-08-15",
    dateNote: "土",
    time: "10:30／12:00／13:30／15:00の4回",
    category: "学び",
    title: "スイーツデコ お菓子のお家の貯金箱をつくろう",
    venue: "イオンモール桑名 1番街2F 東出入口前 会場",
    cost: "イオンモールアプリ提示で税込200円",
    audience: "小学生以下のお子さま限定",
    summary:
      "お家型の貯金箱にスイーツデコのパーツを貼り付けます。定員は合計50名で、当日10:00から会場で整理券を配布します。アプリからの事前予約はありません。",
    tags: ["屋内", "商業施設", "工作", "整理券", "定員50名", "子ども"],
    source: kuwanaSrc("event_e84139_as.html", "2026-08-14"),
  },
  {
    ...kuwana,
    id: "kuwana-human-crane-2026",
    startDate: "2026-08-15",
    endDate: "2026-08-16",
    dateNote: "土・日",
    time: "11:00–17:00",
    category: "交流",
    title: "人間クレーンゲーム＆バルーン抽選会",
    venue: "イオンモール桑名 3番街2階 ブックオフスーパーバザー奥特設会場",
    cost: "人間クレーンゲームは税込500円（バルーン抽選会は当日レシート税込2,500円以上で参加）",
    audience: "公式に対象の記載なし",
    summary:
      "自分がクレーンになって景品をねらう人間クレーンゲーム。併設のバルーン抽選会は当日のお買い上げレシートが必要で、当たりは各日50名にお買物券500円です。",
    tags: ["屋内", "商業施設", "ゲーム", "有料"],
    source: kuwanaSrc("event_e84960_as.html", "2026-08-14"),
  },
  {
    ...kuwana,
    id: "kuwana-diorama-box-2026",
    startDate: "2026-08-16",
    endDate: "2026-08-16",
    dateNote: "日",
    time: "10:30／12:00／13:30／15:00の4回",
    category: "学び",
    title: "夏のジオラマボックスをつくろう",
    venue: "イオンモール桑名 1番街2F 東出入口前 会場",
    cost: "イオンモールアプリ提示で税込200円",
    audience: "小学生以下のお子さま限定",
    summary:
      "ウッドボックスの上に砂やモス、フィギュアで夏のジオラマをつくります。定員は合計50名で、当日10:00から会場で整理券を配布します。",
    tags: ["屋内", "商業施設", "工作", "整理券", "定員50名", "子ども"],
    source: kuwanaSrc("event_e84140_as.html", "2026-08-15"),
  },
  {
    ...kuwana,
    id: "kuwana-miso-kyoshitsu-2026",
    startDate: "2026-08-22",
    endDate: "2026-08-22",
    dateNote: "土",
    time: "時間は公式情報で確認",
    category: "学び",
    title: "お味噌屋さんが教える手作り味噌教室",
    venue: "イオンモール桑名 1番街2F 東出入口",
    cost: "1セット1,000円（税込・材料費込／現金のみ）",
    audience: "小さなお子さまも参加できます",
    summary:
      "天然醸造の味噌を守る桝塚味噌の蔵元が講師。発酵から学びながら自分の味噌を仕込みます。各回定員20名。アプリのクーポンで100円引、キッズクラブ会員の子どもは200円引で、併用はできません。",
    tags: ["屋内", "商業施設", "食育", "各回20名", "子ども"],
    source: kuwanaSrc("event_e85681_as.html", "2026-08-21"),
  },

  // ============================================================ イオンモール鈴鹿
  {
    ...suzuka,
    id: "suzuka-honda-baseball-fan-2026",
    startDate: "2026-08-11",
    endDate: "2026-08-11",
    dateNote: "火",
    time: "10:30–13:00／14:00–16:00",
    category: "交流",
    title: "【Honda鈴鹿硬式野球部】ファン感謝交流会",
    venue: "イオンモール鈴鹿 専門店街1階 セントラルコート",
    cost: "料金は公式情報で確認",
    audience: "公式に対象の記載なし",
    summary:
      "午前はアトラクション体験、午後は選手との交流。ミニゲームやキャッチボールがあります。8月26日から東京ドームで開かれる第97回都市対抗野球に出場する選手が参加します。",
    tags: ["屋内", "商業施設", "野球", "選手交流"],
    source: suzukaSrc("bb7ed6b5-466d-4a92-8909-27eaf541049d", "2026-08-10"),
  },
  {
    ...suzuka,
    id: "suzuka-spogomi-2026",
    startDate: "2026-08-23",
    endDate: "2026-08-23",
    dateNote: "日",
    time: "9:30–12:00（受付9:00〜）",
    category: "スポーツ",
    title: "スポGOMIワールドカップ2027 三重ステージ",
    venue: "イオンモール鈴鹿 専門店街中央入口前",
    cost: "参加費は公式情報で確認",
    audience: "3名1組のチーム（12歳未満を含む場合は18歳以上を1名以上含む）",
    summary:
      "制限時間内のごみ拾いを競う大会。2名以上が日本国籍である必要があります。申込はGoogleフォームで8月22日まで、応募多数の場合は抽選です。雨天時は9月13日に順延します。",
    tags: ["屋外", "商業施設", "日程変更注意", "要申込", "3人1組", "環境"],
    source: suzukaSrc("867d31c0-d865-4404-8388-77bc03682f83", "2026-08-22"),
  },
  {
    ...suzuka,
    id: "suzuka-pokemon-zukan-panel-2026",
    startDate: "2026-09-05",
    endDate: "2026-09-06",
    dateNote: "土・日",
    time: "10:00–17:00",
    category: "交流",
    title: "めくって みっけ！ ポケモンずかんパネル1025 inイオンモール",
    venue: "イオンモール鈴鹿 専門店街1階 北コート",
    cost: "無料",
    audience: "パネルをめくる体験は小学6年生まで（観覧はどなたでも）",
    summary:
      "初日はパネルをめくってポケモンを出し、2日目は完成したパネルと写真を撮れます。パネルピースには数に限りがあり、ポスターも数量限定で配られます。",
    tags: ["屋内", "商業施設", "無料", "申込不要", "キャラクター", "子ども"],
    source: suzukaSrc("55c3c5cd-2e22-4944-a3c8-46d696324c36", "2026-09-04"),
  },
  {
    ...suzuka,
    id: "suzuka-bicycle-trial-motocross-2026",
    startDate: "2026-09-06",
    endDate: "2026-09-06",
    dateNote: "日",
    time: "10:00–12:00",
    category: "交流",
    title: "自転車deトライアル・モトクロス体験",
    venue: "イオンモール鈴鹿 平面第3駐車場",
    cost: "参加費は公式情報で確認",
    audience: "初めての人、大人も子どもも参加できます",
    summary:
      "駐車場を使った自転車トライアルとモトクロスの体験会。体験定員は60名で、事前エントリーが必要です。申込時に自転車持参かレンタル希望かを選びます。",
    tags: ["屋外", "商業施設", "自転車", "要申込", "定員60名", "子ども"],
    source: suzukaSrc("6e82eae1-400b-4f0e-a5c3-13f86e87ad8e", "2026-09-05"),
  },

  // ============================================================ イオンモール津南
  {
    ...tsuminami,
    id: "tsuminami-tsu-hanabi-rooftop-2026",
    startDate: "2026-07-25",
    endDate: "2026-07-25",
    dateNote: "土",
    time: "17:00–21:00",
    category: "祭り",
    title: "津の花火大会をイオンモール津南の屋上で見よう",
    venue: "イオンモール津南 屋上駐車場",
    cost: "料金は公式情報で確認",
    audience: "お子さまから大人まで",
    summary:
      "屋上駐車場を開放し、花火の観覧に加えて盆踊り、水鉄砲の対戦、縁日、フード出店があります。カルピスじゃぐちの体験は先着1000名です。天候により変更・中止となる場合があります。",
    tags: ["屋外", "商業施設", "花火", "夜", "縁日", "子ども"],
    source: tsuSrc("f92e546d-bb89-477f-bece-34b958202ee7", "2026-07-25"),
  },
  {
    ...tsuminami,
    id: "tsuminami-world-insect-kingdom-2026",
    startDate: "2026-07-25",
    endDate: "2026-08-02",
    dateNote: "期間中",
    time: "10:00–18:00（最終入場17:30）",
    category: "展覧会",
    title: "世界の昆虫王国 〜生きた昆虫とわくわくキメラ体験〜",
    venue: "イオンモール津南 3F イオンホール",
    cost: "大人800円（税込）、子ども500円（税込）、3歳以下無料",
    audience: "親子向け（3歳以下は無料）",
    summary:
      "生きた昆虫の展示と体験コーナー。7月17日から始まっており、最終入場は17:30です。",
    tags: ["屋内", "商業施設", "昆虫", "夏休み", "親子", "子ども"],
    source: tsuSrc("6d2e0f9a-691d-486b-912d-baaa95ffdbad", "2026-08-01"),
  },
  {
    ...tsuminami,
    id: "tsuminami-genki-labo-2026",
    startDate: "2026-08-15",
    endDate: "2026-08-15",
    dateNote: "土",
    time: "①11:00–11:30 ②14:00–14:30",
    category: "学び",
    title: "ドキドキ大爆発！GENKI LABOサイエンスライブ",
    venue: "イオンモール津南 1F つどいの広場",
    cost: "観覧無料",
    audience: "お子さま向け（立ち見は自由）",
    summary:
      "30分のサイエンスショーを2回。イス席の整理券は当日9:30から配布し、各回50枚です。立ち見は先着順で観覧できます。",
    tags: ["屋内", "商業施設", "観覧無料", "科学", "整理券", "子ども"],
    source: tsuSrc("f932615c-f4d2-473d-be17-3468b44ccbb2", "2026-08-14"),
  },
  {
    ...tsuminami,
    id: "tsuminami-conan-escape-2026",
    startDate: "2026-09-26",
    endDate: "2026-09-27",
    dateNote: "土・日",
    time: "10:30／14:00／17:30",
    category: "交流",
    title: "リアル脱出ゲーム×名探偵コナン 疾風の追走からの脱出",
    venue: "イオンモール津南 3F イオンホール",
    cost: "前売 一般3,700円・forkids 2,700円／当日 一般4,000円・forkids 3,000円（税込）",
    audience: "forkidsチケットは小学生以下（保護者は別途一般チケットが必要）",
    summary:
      "各日3回公演の体験型脱出ゲーム。受付は開始20分前からです。前売の方が安く設定されています。",
    tags: ["屋内", "商業施設", "謎解き", "前売あり", "子ども"],
    source: tsuSrc("c5c14afb-489b-42c3-9710-815c35d9805e", "2026-09-25"),
  },

  // ==================================================================== VISON
  {
    ...vison,
    id: "vison-ikimono-chosatai-2026-07",
    startDate: "2026-07-26",
    endDate: "2026-07-26",
    dateNote: "日",
    time: "10:30–12:00／13:30–15:00",
    category: "学び",
    title: "【VISONの森】森のいきもの調査隊！",
    venue: "VISON 木育エリア kiond",
    cost: "1名1,500円（税込・大人こども共通）",
    audience: "公式に年齢制限の記載なし（親子向けの案内）",
    summary:
      "自然観察指導員の田川修氏と森の調査隊を結成し、仕掛けたトラップを見にいきます。定員15名で、kiondの予約サイトか店舗電話で受け付けます。",
    tags: ["屋外", "商業施設", "自然観察", "要予約", "定員15名", "子ども"],
    source: visonSrc(1252, "2026-07-25"),
  },
  {
    ...vison,
    id: "vison-mini-smartball-2026",
    startDate: "2026-08-01",
    endDate: "2026-08-29",
    dates: [
      "2026-08-01",
      "2026-08-09",
      "2026-08-13",
      "2026-08-15",
      "2026-08-21",
      "2026-08-23",
      "2026-08-29",
    ],
    dateNote: "8月の指定日",
    time: "10:30–12:30／14:00–16:00",
    category: "学び",
    title: "【夏休み工作！】ミニスマートボール作り",
    venue: "VISON 木育エリア kiond",
    cost: "1作品3,000円（税込）",
    audience: "公式に年齢制限の記載なし（親子向けの案内）",
    summary:
      "本格的な工具も使って、親子でオリジナルのスマートボールを組み上げます。夏休みの自由研究にも向きます。定員12名で、kiondの予約サイトか店舗電話で受け付けます。",
    tags: ["屋内", "商業施設", "工作", "自由研究", "要予約", "定員12名", "子ども"],
    source: visonSrc(1245, "2026-07-31"),
  },
  {
    ...vison,
    id: "vison-mini-shateki-2026",
    startDate: "2026-08-02",
    endDate: "2026-08-30",
    dates: [
      "2026-08-02",
      "2026-08-08",
      "2026-08-12",
      "2026-08-14",
      "2026-08-22",
      "2026-08-24",
      "2026-08-30",
    ],
    dateNote: "8月の指定日",
    time: "10:30–12:30／14:00–16:00",
    category: "学び",
    title: "【夏休み工作！】ミニ射的屋台作り",
    venue: "VISON 木育エリア kiond",
    cost: "1作品3,000円（税込）",
    audience: "公式に年齢制限の記載なし（親子向けの案内）",
    summary:
      "kiond縁日の射的を卓上サイズにした工作。板から屋台を組み上げて、自分の射的ゲームをつくります。kiondの予約サイトか店舗電話で受け付けます。",
    tags: ["屋内", "商業施設", "工作", "自由研究", "要予約", "子ども"],
    source: visonSrc(1240, "2026-08-01"),
  },
  {
    ...vison,
    id: "vison-koke-terrarium-2026-08",
    startDate: "2026-08-04",
    endDate: "2026-08-17",
    dates: ["2026-08-04", "2026-08-17"],
    dateNote: "火・月",
    time: "13:00–14:00",
    category: "学び",
    title: "森の素材を使ってコケテラリウム",
    venue: "VISON 木育エリア kiond",
    cost: "1名3,000円（税込）",
    audience: "公式に年齢制限の記載なし",
    summary:
      "kiondの森で集めた素材を使い、小さなガラス容器の中に森をつくります。定員20名で、kiondの予約サイトか店舗電話で受け付けます。",
    tags: ["屋内", "商業施設", "工作", "要予約", "定員20名"],
    source: visonSrc(1249, "2026-08-03"),
  },
  {
    ...vison,
    id: "vison-kumiko-coaster-2026-08",
    startDate: "2026-08-07",
    endDate: "2026-08-11",
    dates: ["2026-08-07", "2026-08-11"],
    dateNote: "金・火",
    time: "8/7 13:00–14:00／8/11 11:00–12:00",
    category: "学び",
    title: "【伝統工芸体験】組子細工でコースター作り",
    venue: "VISON 木育エリア kiond",
    cost: "1作品3,500円（税込）",
    audience: "公式に年齢制限の記載なし",
    summary:
      "「ねじり組子」と「千鳥柄」の2種類から選び、伝統の技でコースターをつくります。kiondの予約サイトか店舗電話で受け付けます。",
    tags: ["屋内", "商業施設", "伝統工芸", "要予約"],
    source: visonSrc(1250, "2026-08-06"),
  },
  {
    ...vison,
    id: "vison-tsunaichi-2026",
    startDate: "2026-08-08",
    endDate: "2026-08-09",
    dateNote: "土・日",
    time: "時間は公式情報で確認",
    category: "交流",
    title: "陶器市と暮らしの道具「綱市」",
    venue: "VISON 和ヴィソン",
    cost: "料金は公式情報で確認",
    audience: "公式に対象の記載なし",
    summary:
      "ショップ『綱具屋』が主催するマルシェの2回目。信楽焼窯元丸十製陶のブランド「CONTENTS」や、ガラスアート「ELTTE」などが並びます。",
    tags: ["屋外", "商業施設", "マルシェ", "陶器", "クラフト"],
    source: visonSrc(1257, "2026-08-07"),
  },
  {
    ...vison,
    id: "vison-okuda-yuderon-2026",
    startDate: "2026-08-09",
    endDate: "2026-08-09",
    dateNote: "日",
    time: "12:00〜",
    category: "学び",
    title: "奥田政行シェフ ゆで論講演会",
    venue: "VISON 農園エリア",
    cost: "8,000円（税込）",
    audience: "公式に対象の記載なし",
    summary:
      "「世界の料理人1000人」に選ばれた奥田政行シェフによる「ゆで論」の講演会。ゆで論を取り入れたスペシャルランチが付きます。要予約です。",
    tags: ["屋内", "商業施設", "食", "講演", "要予約", "ランチ付"],
    source: visonSrc(1270, "2026-08-08"),
  },
  {
    ...vison,
    id: "vison-musasabi-2026",
    startDate: "2026-08-09",
    endDate: "2026-08-31",
    dates: ["2026-08-09", "2026-08-31"],
    dateNote: "日・月",
    time: "10:30–11:30／13:00–14:00 ほか",
    category: "学び",
    title: "森のぬくもりを手のひらに「ころんとかわいいムササビ」",
    venue: "VISON 木育エリア kiond",
    cost: "1作品3,600円（税込）",
    audience: "公式に年齢制限の記載なし",
    summary:
      "木を磨いて表情を育てていくクラフト体験。本格的な彫刻ではないので、シンプルな作業を重ねてつくれます。定員15作品で、kiondの予約サイトか店舗電話で受け付けます。",
    tags: ["屋内", "商業施設", "工作", "要予約", "定員15作品"],
    source: visonSrc(1247, "2026-08-08"),
  },
  {
    ...vison,
    id: "vison-hinoki-chopsticks-2026-08",
    startDate: "2026-08-10",
    endDate: "2026-08-15",
    dates: ["2026-08-10", "2026-08-15"],
    dateNote: "月・土",
    time: "10:30–12:30／14:00–16:00",
    category: "学び",
    title: "贅沢ヒノキの手作り箸体験",
    venue: "VISON 木育エリア kiond",
    cost: "1名3,000円（税込）",
    audience: "大人から子どもまで参加できます",
    summary:
      "治具に材を乗せ、鉋で削ってマイ箸をつくります。だんだん箸の形になっていく過程を楽しめます。定員20名で、kiondの予約サイトか店舗電話で受け付けます。",
    tags: ["屋内", "商業施設", "工作", "要予約", "定員20名", "子ども"],
    source: visonSrc(1253, "2026-08-09"),
  },
  {
    ...vison,
    id: "vison-uv-gel-2026",
    startDate: "2026-08-10",
    endDate: "2026-08-10",
    dateNote: "月",
    time: "11:00–13:00",
    category: "学び",
    title: "アッシュ夏の身体 〜碧の紫外線対策ジェル作り〜",
    venue: "VISON 本草エリア 本草研究所RINNE",
    cost: "8,800円",
    audience: "公式に対象の記載なし",
    summary:
      "植物で夏の身体とセルフケアを考えながら、乳化剤不使用・天然素材の紫外線対策ジェルをつくります。美容液や化粧下地にも使えます。電話または予約フォームから申し込みます。",
    tags: ["屋内", "商業施設", "ワークショップ", "要予約", "植物"],
    source: visonSrc(1276, "2026-08-09"),
  },
  {
    ...vison,
    id: "vison-meiro-board-2026-08",
    startDate: "2026-08-11",
    endDate: "2026-08-11",
    dateNote: "火",
    time: "10:30–12:30／14:00–16:00",
    category: "学び",
    title: "【夏休み工作】木でつくる！オリジナル迷路ボード",
    venue: "VISON 木育エリア kiond",
    cost: "1作品2,800円（税込）",
    audience: "公式に年齢制限の記載なし（親子向けの案内）",
    summary:
      "木の板を自由に組み合わせて、自分だけの迷路ボードをつくります。定員12作品で、kiondの予約サイトか店舗電話で受け付けます。",
    tags: ["屋内", "商業施設", "工作", "自由研究", "要予約", "定員12作品", "子ども"],
    source: visonSrc(1244, "2026-08-10"),
  },
  {
    ...vison,
    id: "vison-mushitori-adventure-2026",
    startDate: "2026-08-16",
    endDate: "2026-08-16",
    dateNote: "日",
    time: "10:30–12:00／13:30–15:00",
    category: "学び",
    title: "夏だ！ワクワク虫取りアドベンチャー",
    venue: "VISON 木育エリア kiond",
    cost: "1名1,500円（税込・大人こども共通）",
    audience: "公式に年齢制限の記載なし（親子向けの案内）",
    summary:
      "自然観察指導員の田川修氏と調査隊を結成し、森に仕掛けたトラップを見にいきます。定員15名で、kiondの予約サイトか店舗電話で受け付けます。",
    tags: ["屋外", "商業施設", "自然観察", "要予約", "定員15名", "子ども"],
    source: visonSrc(1251, "2026-08-15"),
  },
  {
    ...vison,
    id: "vison-bonbon-bon-matsuri-2026",
    startDate: "2026-08-18",
    endDate: "2026-08-18",
    dateNote: "火",
    time: "17:00〜20:30終了予定",
    category: "祭り",
    title: "BonBon盆祭",
    venue: "VISON 和ヴィソン 食祭広場（雨天時はVISON DOME）",
    cost: "料金は公式情報で確認",
    audience: "公式に対象の記載なし",
    summary:
      "17:00からBonBon縁日、18:00から極楽座、19:00頃から丹生音頭、19:30からイマジン盆踊り部。生うたと生バンドの盆踊りです。射的などのゲームやフード・ドリンクも出ます。",
    tags: ["屋外", "商業施設", "盆踊り", "夜", "縁日", "雨天時会場変更"],
    source: visonSrc(1259, "2026-08-17"),
  },
  {
    ...vison,
    id: "vison-sansanichi-2026-10",
    startDate: "2026-10-18",
    endDate: "2026-10-18",
    dateNote: "日",
    time: "時間は公式情報で確認",
    category: "交流",
    title: "燦燦市",
    venue: "VISON 和ヴィソン",
    cost: "料金は公式情報で確認",
    audience: "公式に対象の記載なし",
    summary:
      "三重で育った海の幸・山の幸・魚・野菜・果物・肉・加工品が集まる日曜朝の市。鮭かま詰め放題や鳥羽答志島産かちりちりめんの枡売りなど、数量限定の品が並びます。",
    tags: ["屋外", "商業施設", "朝市", "マルシェ", "食"],
    source: visonSrc(1065, "2026-10-11"),
  },
];

const payload = JSON.parse(await readFile(dataUrl, "utf8"));
const existingIds = new Set(payload.events.map((event) => event.id));

let added = 0;
for (const event of additions) {
  if (existingIds.has(event.id)) {
    console.log(`skip (already present): ${event.id}`);
    continue;
  }
  payload.events.push(event);
  existingIds.add(event.id);
  added += 1;
}

payload.events.sort((left, right) => left.startDate.localeCompare(right.startDate));
payload.updatedAt = "2026-07-25";
await writeFile(dataUrl, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const byFacility = {};
for (const event of payload.events) {
  if (!event.facility) continue;
  byFacility[event.facility.name] = (byFacility[event.facility.name] ?? 0) + 1;
}
console.log(`\nadded ${added}; total is now ${payload.events.length}`);
console.log("facility events:", byFacility);
