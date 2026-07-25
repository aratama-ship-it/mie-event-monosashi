"use client";

import { useEffect, useMemo, useState } from "react";
import eventData from "@/data/events.json";
import {
  addDays,
  datePresets,
  eventOccursOn,
  formatEventDate,
  hasEnded,
  isOngoing,
  nextOccurrence,
  occursInRange,
  spanInDays,
} from "@/lib/event-dates.mjs";

type PresetId = "all" | "weekend" | "this-month" | "next-month";
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
  /** First day. Structured dates are the source of truth; display is derived. */
  startDate: string;
  /** Last day. Equal to startDate for a single-day event. */
  endDate: string;
  /** Explicit occurrence list, present only for non-contiguous series. */
  dates?: string[];
  /** 0 = Sunday. From notes like "月曜休館". */
  closedWeekdays?: number[];
  /** A weekday for a single day, or editorial text such as "月曜休館". */
  dateNote: string;
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
  /**
   * Pins the child rating when reading it out of `audience` would be wrong.
   * Leave unset to let the wording decide.
   */
  childFit?: ChildFitId;
  /** Present when the event is held inside a commercial facility. */
  facility?: { name: string; type: string };
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

const allEvents = eventData.events as EventItem[];

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

function displayDate(value: string) {
  return value.replaceAll("-", ".");
}

function isoDateInJapan(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function dateDetails(isoDate: string) {
  const [, month, day] = isoDate.split("-").map(Number);
  const weekday = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return {
    day,
    month,
    monthDay: `${month}/${day}`,
    weekday,
    weekdayLabel: weekdayLabels[weekday],
  };
}

const needs = [
  "ライブ",
  "大型ライブ",
  "無料",
  "申込不要",
  "子ども向け",
  "子ども参加可",
  "屋内",
  "商業施設",
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

/**
 * The child rating, from the record when it states one and from the wording of
 * `audience` otherwise.
 *
 * Reading it out of free text is only ever an approximation, and it can invert
 * the meaning: "18歳以上を1名以上含む" is a requirement on the group, but a
 * substring match reads it as an adults-only restriction. Because a wrong ◎ or ×
 * on a child-safety question is the most damaging error this site can make, any
 * record may pin the rating with `childFit` and keep the evidence in `audience`.
 */
function assessChildFit(event: EventItem): ChildFit {
  if (event.childFit) {
    const pinned = childFitScale.find((item) => item.id === event.childFit);
    if (pinned) return pinned;
  }
  return inferChildFit(event);
}

function inferChildFit(event: EventItem): ChildFit {
  const positiveTags = event.tags.filter((tag) => !/不可|確認/.test(tag)).join(" ");
  const positiveAudience = event.audience
    .replace(/未就学児[^・／]*不可/g, "")
    .replace(/3歳未満[^・／]*不可/g, "")
    .replace(/子どものみ[^・／]*不可/g, "");
  const text = `${positiveAudience} ${positiveTags}`;
  const sourceText = `${event.audience} ${event.tags.join(" ")}`;
  // "お子さま" and "家族" are how commercial facilities almost always word their
  // target, so leaving them out silently downgraded mall events to 「公式で要確認」.
  const childTarget =
    /子ども|子供|お子さま|親子|家族|ファミリー|児童館|小学生|中学生|未就学児|赤ちゃん|0歳から/.test(
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
  if (need === "商業施設") {
    return Boolean(event.facility);
  }
  return `${event.tags.join(" ")} ${event.cost} ${event.audience}`.includes(need);
}

export default function Home() {
  const [period, setPeriod] = useState<PresetId>("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [region, setRegion] = useState("すべて");
  const [category, setCategory] = useState<Category>("すべて");
  const [need, setNeed] = useState("");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [todayIso] = useState(() => isoDateInJapan());
  const tomorrowIso = addDays(todayIso, 1);

  // An event that finished yesterday is not something anyone can go to, so it
  // never reaches the listing. Multi-day events stay until their last day.
  const events = useMemo(
    () =>
      allEvents
        .filter((event) => !hasEnded(event, todayIso))
        .slice()
        .sort((left, right) => {
          const leftNext = nextOccurrence(left, todayIso) ?? left.endDate;
          const rightNext = nextOccurrence(right, todayIso) ?? right.endDate;
          if (leftNext !== rightNext) return leftNext.localeCompare(rightNext);
          // Among events available on the same day, the one with the narrowest
          // window is the one you have to decide about now.
          return spanInDays(left) - spanInDays(right) || left.startDate.localeCompare(right.startDate);
        }),
    [todayIso],
  );

  const presets = useMemo(() => datePresets(todayIso), [todayIso]);

  const calendarDays = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const isoDate = addDays(todayIso, index);
        return { isoDate, ...dateDetails(isoDate) };
      }),
    [todayIso],
  );
  const heroDays = calendarDays.slice(0, 7);

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

  const resultsWithoutDate = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return events.filter((event) => {
      const regionMatch =
        region === "すべて" || event.region.split("・").includes(region);
      const categoryMatch = category === "すべて" || event.category === category;
      const needMatch = matchesNeed(event, need);
      const queryMatch =
        !normalized ||
        `${event.category} ${event.title} ${event.municipality} ${event.venue} ${event.tags.join(" ")}`
          .toLowerCase()
          .includes(normalized);
      return regionMatch && categoryMatch && needMatch && queryMatch;
    });
  }, [category, events, need, query, region]);

  const calendarCounts = useMemo(
    () =>
      Object.fromEntries(
        calendarDays.map(({ isoDate }) => [
          isoDate,
          resultsWithoutDate.filter((event) => eventOccursOn(event, isoDate)).length,
        ]),
      ),
    [calendarDays, resultsWithoutDate],
  );

  const results = useMemo(() => {
    if (selectedDate) {
      // On a chosen day, an event that begins that day outranks one already running.
      return resultsWithoutDate
        .filter((event) => eventOccursOn(event, selectedDate))
        .sort(
          (left, right) =>
            Number(right.startDate === selectedDate) - Number(left.startDate === selectedDate) ||
            spanInDays(left) - spanInDays(right),
        );
    }
    const preset = presets.find((item) => item.id === period);
    if (preset) {
      return resultsWithoutDate.filter((event) => occursInRange(event, preset.from, preset.to));
    }
    return resultsWithoutDate;
  }, [period, presets, resultsWithoutDate, selectedDate]);

  const chooseDate = (isoDate: string) => {
    setSelectedDate(isoDate);
    setPeriod("all");
  };

  const choosePeriod = (nextPeriod: PresetId) => {
    setSelectedDate("");
    setPeriod(nextPeriod);
  };

  const selectedDateLabel = selectedDate
    ? (() => {
        const date = dateDetails(selectedDate);
        const relative =
          selectedDate === todayIso ? "今日・" : selectedDate === tomorrowIso ? "明日・" : "";
        return `${relative}${date.month}月${date.day}日（${date.weekdayLabel}）`;
      })()
    : "";

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
    setSelectedDate("");
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
          <div className="hero-mobile-actions" aria-label="スマートフォン向けショートカット">
            <a className="mobile-primary-link" href="#results">
              催しを見る <strong>{events.length}</strong>
            </a>
            <a href="#finder">条件で絞る</a>
          </div>
        </div>
        <div className="week-scale" aria-label="直近の日付の目盛り">
          <span className="scale-caption">
            {new Date(`${todayIso}T00:00:00Z`)
              .toLocaleDateString("en-US", { month: "long", timeZone: "UTC" })
              .toUpperCase()}{" "}
            {todayIso.slice(0, 4)}
          </span>
          {heroDays.map((date, index) => (
            <span
              className={
                index === 0 ? "today" : date.weekday === 0 || date.weekday === 6 ? "weekend" : ""
              }
              key={date.isoDate}
            >
              {date.day} {date.weekdayLabel}
            </span>
          ))}
        </div>
      </section>

      <section className="finder" id="finder" aria-label="イベントを絞り込む">
        <div className="finder-topline">
          <span>週末のものさし</span>
          <button type="button" onClick={reset} className="reset-button">
            条件をリセット
          </button>
        </div>

        <div className="filter-grid">
          <fieldset className="period-filter">
            <legend>いつ行く？</legend>
            <div className="date-shortcuts">
              <button
                aria-pressed={!selectedDate && period === "all"}
                className={!selectedDate && period === "all" ? "active" : ""}
                onClick={() => choosePeriod("all")}
                type="button"
              >
                <span>すべて</span>
                <small>{resultsWithoutDate.length}件</small>
              </button>
              <button
                aria-pressed={selectedDate === todayIso}
                className={selectedDate === todayIso ? "active" : ""}
                onClick={() => chooseDate(todayIso)}
                type="button"
              >
                <span>今日</span>
                <small>{calendarCounts[todayIso] ?? 0}件</small>
              </button>
              <button
                aria-pressed={selectedDate === tomorrowIso}
                className={selectedDate === tomorrowIso ? "active" : ""}
                onClick={() => chooseDate(tomorrowIso)}
                type="button"
              >
                <span>明日</span>
                <small>{calendarCounts[tomorrowIso] ?? 0}件</small>
              </button>
              <label className="specific-date">
                <span>日付を指定</span>
                <input
                  type="date"
                  min={todayIso}
                  value={selectedDate}
                  onChange={(event) =>
                    event.target.value ? chooseDate(event.target.value) : choosePeriod("all")
                  }
                />
              </label>
            </div>

            <details className="date-calendar">
              <summary className="date-calendar-summary">
                <span className="date-calendar-summary-copy">
                  <strong>30日カレンダー</strong>
                  <small>日ごとの件数を見る</small>
                </span>
                <span className="date-calendar-toggle" aria-hidden="true">
                  <span className="calendar-label-open">開く</span>
                  <span className="calendar-label-close">閉じる</span>
                </span>
              </summary>
              <div className="date-calendar-panel" aria-label="今日から30日間のイベント件数">
                <p className="date-calendar-note">数字は現在の条件での件数</p>
                <div className="date-calendar-weekdays" aria-hidden="true">
                  {weekdayLabels.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>
                <div className="date-calendar-grid">
                  {calendarDays.map((date, index) => {
                    const count = calendarCounts[date.isoDate] ?? 0;
                    return (
                      <button
                        aria-current={date.isoDate === todayIso ? "date" : undefined}
                        aria-label={`${date.month}月${date.day}日（${date.weekdayLabel}）、${count}件`}
                        aria-pressed={selectedDate === date.isoDate}
                        className={[
                          selectedDate === date.isoDate ? "active" : "",
                          date.weekday === 0 ? "sunday" : "",
                          date.weekday === 6 ? "saturday" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        data-calendar-date={date.isoDate}
                        key={date.isoDate}
                        onClick={() => chooseDate(date.isoDate)}
                        style={index === 0 ? { gridColumnStart: date.weekday + 1 } : undefined}
                        type="button"
                      >
                        <span>{date.monthDay}</span>
                        <small>{count}件</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            </details>

            <div className="period-presets">
              <span>期間で見る</span>
              <div className="segmented">
                {presets.map((item) => (
                  <button
                    aria-pressed={!selectedDate && period === item.id}
                    className={!selectedDate && period === item.id ? "active" : ""}
                    key={item.id}
                    onClick={() => choosePeriod(item.id as PresetId)}
                    type="button"
                  >
                    <span>{item.label}</span>
                    <small>
                      {
                        resultsWithoutDate.filter((event) =>
                          occursInRange(event, item.from, item.to),
                        ).length
                      }
                      件
                    </small>
                  </button>
                ))}
              </div>
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
            {selectedDateLabel && <p className="results-date-caption">{selectedDateLabel}</p>}
          </div>
          <p>
            <strong>{results.length}</strong> / {events.length}件
          </p>
        </div>

        <div className="event-list" aria-live="polite">
          {results.map((event) => {
            const isSaved = saved.includes(event.id);
            const childFit = assessChildFit(event);
            const { month, day } = formatEventDate(event);
            const daySize = day.length >= 7 ? "is-long" : day.length >= 4 ? "is-range" : "";
            const ongoing = isOngoing(event, todayIso);
            const startsToday = event.startDate === todayIso;
            return (
              <article
                className="event-card"
                key={event.id}
                data-region={event.region}
                data-category={event.category}
                data-child-fit={childFit.id}
                data-ongoing={ongoing && !startsToday ? "true" : undefined}
              >
                <time className="event-date" dateTime={event.startDate}>
                  <span>{month}月</span>
                  <strong className={daySize}>{day}</strong>
                  <em>{event.dateNote}</em>
                </time>

                <div className="event-main">
                  <div className="event-kicker">
                    {ongoing && !startsToday && <span className="ongoing-flag">開催中</span>}
                    <span className="event-category">{event.category}</span>
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
                    <span className="official-link-long">公式情報で最終確認</span>
                    <span className="official-link-short">公式情報を見る</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                  <small className="source-meta">
                    <span>一次資料・{event.source.label}</span>
                    <span>確認 {displayDate(event.source.verifiedAt)}</span>
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
