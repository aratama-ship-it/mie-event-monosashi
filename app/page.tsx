"use client";

import { useEffect, useMemo, useState } from "react";
import eventData from "@/data/events.json";

type Period = "all" | "weekend" | "august" | "september";
type Category =
  | "すべて"
  | "祭り"
  | "舞台"
  | "音楽"
  | "展覧会"
  | "学び"
  | "交流"
  | "スポーツ";

type EventItem = {
  id: string;
  month: string;
  day: string;
  weekday: string;
  isoDate: string;
  time: string;
  region: string;
  municipality: string;
  category: Exclude<Category, "すべて">;
  title: string;
  venue: string;
  cost: string;
  audience: string;
  summary: string;
  tags: string[];
  period: Exclude<Period, "all">;
  status: "published";
  source: {
    kind: "primary";
    label: string;
    url: string;
    verifiedAt: string;
    nextCheckAt: string;
  };
};

type ChildFitId =
  | "for-children"
  | "allowed"
  | "conditional"
  | "not-for-children"
  | "unknown";

type ChildFit = {
  id: ChildFitId;
  symbol: "◎" | "○" | "△" | "×" | "？";
  label: string;
  detail: string;
};

const events = (eventData.events as EventItem[])
  .slice()
  .sort((left, right) => left.isoDate.localeCompare(right.isoDate));

function displayDate(value: string) {
  return value.replaceAll("-", ".");
}

const periods: { id: Period; label: string; note: string }[] = [
  { id: "all", label: "すべて", note: `${events.length}件` },
  {
    id: "weekend",
    label: "7月末まで",
    note: `${events.filter((event) => event.period === "weekend").length}件`,
  },
  {
    id: "august",
    label: "8月",
    note: `${events.filter((event) => event.period === "august").length}件`,
  },
  {
    id: "september",
    label: "9月以降",
    note: `${events.filter((event) => event.period === "september").length}件`,
  },
];

const needs = [
  "ライブ",
  "大型ライブ",
  "無料",
  "申込不要",
  "子ども向け",
  "子ども参加可",
  "屋内",
  "託児あり",
];

const childFitScale: ChildFit[] = [
  {
    id: "for-children",
    symbol: "◎",
    label: "子ども向け",
    detail: "公式の対象に、子ども・親子・ファミリーの記載があります",
  },
  {
    id: "allowed",
    symbol: "○",
    label: "子ども参加可",
    detail: "公式に「どなたでも」「年齢制限なし」などの記載があります",
  },
  {
    id: "conditional",
    symbol: "△",
    label: "条件あり",
    detail: "年齢制限、保護者同伴、託児などの条件を確認してください",
  },
  {
    id: "not-for-children",
    symbol: "×",
    label: "子ども対象外",
    detail: "公式の対象が成人または大人向けに限定されています",
  },
  {
    id: "unknown",
    symbol: "？",
    label: "公式で要確認",
    detail: "一次資料だけでは子どもの参加可否を判断できません",
  },
];

function assessChildFit(event: EventItem): ChildFit {
  const positiveTags = event.tags.filter((tag) => !/不可|確認/.test(tag)).join(" ");
  const positiveAudience = event.audience
    .replace(/未就学児[^・／]*不可/g, "")
    .replace(/3歳未満[^・／]*不可/g, "")
    .replace(/子どものみ[^・／]*不可/g, "");
  const text = `${positiveAudience} ${positiveTags}`;
  const sourceText = `${event.audience} ${event.tags.join(" ")}`;
  const childTarget =
    /子ども|子供|親子|ファミリー|児童館|小学生|中学生|未就学児|赤ちゃん|0歳から/.test(
      text,
    );

  if (childTarget) return childFitScale[0];

  if (/大人向け|成人限定|18歳以上|20歳以上|25歳以上|25〜39歳/.test(sourceText)) {
    return childFitScale[3];
  }

  if (
    /どなたでも|一般参加可|年齢制限なし|0歳から入場可|子ども連れ歓迎|赤ちゃんスペース/.test(
      event.audience,
    )
  ) {
    return childFitScale[1];
  }

  if (
    /未就学児.*不可|3歳未満.*不可|4歳以上|小学生以上|子どものみ.*不可|託児あり/.test(
      `${event.audience} ${event.tags.join(" ")}`,
    )
  ) {
    return childFitScale[2];
  }

  return childFitScale[4];
}

function matchesNeed(event: EventItem, need: string) {
  if (!need) return true;
  if (need === "子ども向け") {
    return assessChildFit(event).id === "for-children";
  }
  if (need === "子ども参加可") {
    return new Set<ChildFitId>(["for-children", "allowed"]).has(assessChildFit(event).id);
  }
  return `${event.tags.join(" ")} ${event.cost} ${event.audience}`.includes(need);
}

export default function Home() {
  const [period, setPeriod] = useState<Period>("all");
  const [region, setRegion] = useState("すべて");
  const [category, setCategory] = useState<Category>("すべて");
  const [need, setNeed] = useState("");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    let restoreTimer: number | undefined;
    try {
      const value = localStorage.getItem("mie-monosashi-saved-v1");
      if (value) {
        const restored = JSON.parse(value) as string[];
        restoreTimer = window.setTimeout(() => setSaved(restored), 0);
      }
    } catch {
      // The mock remains usable when browser storage is unavailable.
    }
    return () => window.clearTimeout(restoreTimer);
  }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return events.filter((event) => {
      const periodMatch = period === "all" || event.period === period;
      const regionMatch =
        region === "すべて" || event.region.split("・").includes(region);
      const categoryMatch = category === "すべて" || event.category === category;
      const needMatch = matchesNeed(event, need);
      const queryMatch =
        !normalized ||
        `${event.category} ${event.title} ${event.municipality} ${event.venue} ${event.tags.join(" ")}`
          .toLowerCase()
          .includes(normalized);
      return periodMatch && regionMatch && categoryMatch && needMatch && queryMatch;
    });
  }, [category, need, period, query, region]);

  const toggleSaved = (id: string) => {
    const next = saved.includes(id)
      ? saved.filter((savedId) => savedId !== id)
      : [...saved, id];
    setSaved(next);
    try {
      localStorage.setItem("mie-monosashi-saved-v1", JSON.stringify(next));
    } catch {
      // Device-local saving is an enhancement, not a requirement.
    }
  };

  const reset = () => {
    setPeriod("all");
    setRegion("すべて");
    setCategory("すべて");
    setNeed("");
    setQuery("");
  };

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="みえのものさし ホーム">
          <span className="mie-silhouette" aria-hidden="true" />
          <span className="wordmark-copy">
            <span className="wordmark-main">みえのものさし</span>
            <span className="wordmark-sub">EVENT FINDER / BETA</span>
          </span>
        </a>
        <div className="header-actions">
          <span className="checked-badge">一次資料を確認</span>
          <a className="header-nav-link" href="/kitchen-cars">
            キッチンカー
          </a>
          <a className="saved-link" href="#results">
            候補 <strong>{saved.length}</strong>
          </a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">祭りも、試合も、音も、展覧会も、三重の予定へ。</p>
          <h1>
            今度の休み、
            <br />
            どこまで行こう。
          </h1>
          <p className="hero-lead">
            日付、地域、参加条件をひと目で比べる。
            <br />
            最後の確認は、主催者の公式情報へ。
          </p>
        </div>
        <div className="week-scale" aria-label="直近の日付の目盛り">
          <span className="scale-caption">JULY 2026</span>
          {["23 木", "24 金", "25 土", "26 日", "27 月", "28 火", "29 水"].map(
            (date, index) => (
              <span className={index === 0 ? "today" : index >= 1 && index <= 3 ? "weekend" : ""} key={date}>
                {date}
              </span>
            ),
          )}
        </div>
      </section>

      <section className="finder" aria-label="イベントを絞り込む">
        <div className="finder-topline">
          <span>週末のものさし</span>
          <button type="button" onClick={reset} className="reset-button">
            条件をリセット
          </button>
        </div>

        <div className="filter-grid">
          <fieldset className="period-filter">
            <legend>いつ行く？</legend>
            <div className="segmented">
              {periods.map((item) => (
                <button
                  aria-pressed={period === item.id}
                  className={period === item.id ? "active" : ""}
                  key={item.id}
                  onClick={() => setPeriod(item.id)}
                  type="button"
                >
                  <span>{item.label}</span>
                  <small>{item.note}</small>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="select-field">
            <span>どの地域？</span>
            <select value={region} onChange={(event) => setRegion(event.target.value)}>
              <option>すべて</option>
              <option>北勢</option>
              <option>中勢</option>
              <option>伊勢志摩</option>
              <option>東紀州</option>
              <option>伊賀</option>
            </select>
          </label>

          <label className="select-field">
            <span>何を見たい？</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as Category)}
            >
              <option>すべて</option>
              <option>スポーツ</option>
              <option>祭り</option>
              <option>舞台</option>
              <option value="音楽">音楽・ライブ</option>
              <option>展覧会</option>
              <option>学び</option>
              <option>交流</option>
            </select>
          </label>

          <label className="search-field">
            <span>ことばで探す</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ライブ、JFL、花火、展覧会…"
            />
          </label>
        </div>

        <div className="need-filter" aria-label="参加条件">
          <span className="need-label">気になる条件</span>
          {needs.map((item) => (
            <button
              aria-pressed={need === item}
              className={need === item ? "active" : ""}
              key={item}
              onClick={() => setNeed(need === item ? "" : item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="child-scale" aria-label="子どもの参加しやすさの見方">
          <div className="child-scale-title">
            <span>子どものものさし</span>
            <small>公式の「対象」記載から判定</small>
          </div>
          <div className="child-scale-keys">
            {childFitScale.map((item) => (
              <span className={`child-scale-key child-fit-${item.id}`} key={item.id} title={item.detail}>
                <strong aria-hidden="true">{item.symbol}</strong>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="results-section" id="results">
        <div className="results-heading">
          <div>
            <p className="eyebrow">MATCHED EVENTS</p>
            <h2>条件に合う催し</h2>
          </div>
          <p>
            <strong>{results.length}</strong> / {events.length}件
          </p>
        </div>

        <div className="event-list" aria-live="polite">
          {results.map((event) => {
            const isSaved = saved.includes(event.id);
            const childFit = assessChildFit(event);
            return (
              <article
                className="event-card"
                key={event.id}
                data-region={event.region}
                data-category={event.category}
                data-child-fit={childFit.id}
              >
                <time className="event-date" dateTime={event.isoDate}>
                  <span>{event.month}月</span>
                  <strong>{event.day}</strong>
                  <em>{event.weekday}</em>
                </time>

                <div className="event-main">
                  <div className="event-kicker">
                    <span>{event.category}</span>
                    <span>{event.region}</span>
                    <span>{event.municipality}</span>
                    <span>{event.time}</span>
                    <span
                      className={`child-fit-badge child-fit-${childFit.id}`}
                      title={childFit.detail}
                      aria-label={`子ども評価：${childFit.label}。${childFit.detail}`}
                    >
                      <strong aria-hidden="true">{childFit.symbol}</strong>
                      {childFit.label}
                    </span>
                  </div>
                  <h3>{event.title}</h3>
                  <p className="event-summary">{event.summary}</p>

                  <dl className="event-facts">
                    <div>
                      <dt>場所</dt>
                      <dd>{event.venue}</dd>
                    </div>
                    <div>
                      <dt>料金</dt>
                      <dd>{event.cost}</dd>
                    </div>
                    <div>
                      <dt>対象</dt>
                      <dd>{event.audience}</dd>
                    </div>
                  </dl>

                  <div className="event-tags">
                    {event.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="event-actions">
                  <button
                    aria-label={`${event.title}を候補${isSaved ? "から外す" : "に保存"}`}
                    aria-pressed={isSaved}
                    className={`save-button ${isSaved ? "saved" : ""}`}
                    onClick={() => toggleSaved(event.id)}
                    type="button"
                  >
                    {isSaved ? "候補に保存済み" : "候補に入れる"}
                  </button>
                  <a href={event.source.url} target="_blank" rel="noreferrer">
                    公式情報で最終確認 <span aria-hidden="true">↗</span>
                  </a>
                  <small>
                    一次資料・{event.source.label}
                    <br />
                    確認 {displayDate(event.source.verifiedAt)}
                    <br />
                    再確認 {displayDate(event.source.nextCheckAt)}
                  </small>
                </div>
              </article>
            );
          })}
        </div>

        {results.length === 0 && (
          <div className="empty-state">
            <strong>今の条件では見つかりませんでした。</strong>
            <p>地域か条件をひとつ外すと、候補が戻ります。</p>
            <button type="button" onClick={reset}>すべての催しを見る</button>
          </div>
        )}
      </section>

      <footer>
        <div>
          <strong>みえのものさし</strong>
          <p>これは企画検討用のモックです。掲載件数・機能・名称は未確定です。</p>
        </div>
        <p className="footer-policy">
          説明文や写真を転載せず、一次資料から確認した事実を独自に整理する設計です。
          開催前には必ず公式情報を確認してください。
        </p>
      </footer>
    </main>
  );
}
