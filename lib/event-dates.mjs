/**
 * Date handling for published events.
 *
 * Structured fields are the source of truth. Display strings are derived here,
 * never parsed. A record carries:
 *
 *   startDate       first day (ISO)
 *   endDate         last day (ISO)
 *   dates           explicit occurrence list, only for non-contiguous series
 *                   such as "every Monday of the summer holiday"
 *   closedWeekdays  optional [0-6] (0 = Sunday), from notes like "月曜休館"
 *   dateNote        editorial note shown next to the date: a weekday for a
 *                   single day, or text like "月曜休館" / "期間中"
 */

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

export function addDays(isoDate, amount) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function weekdayOf(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay();
}

export function weekdayLabelOf(isoDate) {
  return weekdayLabels[weekdayOf(isoDate)];
}

export function daysBetween(fromIso, toIso) {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

/** Whether the event is open to visitors on a date. */
export function eventOccursOn(event, targetDate) {
  if (event.closedWeekdays?.includes(weekdayOf(targetDate))) return false;
  if (event.dates) return event.dates.includes(targetDate);
  return targetDate >= event.startDate && targetDate <= event.endDate;
}

/** True once the last day has passed. Ongoing multi-day events stay false. */
export function hasEnded(event, todayIso) {
  return event.endDate < todayIso;
}

/** True when the event has started but not finished. */
export function isOngoing(event, todayIso) {
  return event.startDate <= todayIso && event.endDate >= todayIso;
}

/**
 * The first day on or after `todayIso` when the event is open, or null when it
 * has finished. Used for ordering: an event happening today sorts above one
 * happening next month.
 */
export function nextOccurrence(event, todayIso) {
  if (hasEnded(event, todayIso)) return null;
  const from = event.startDate > todayIso ? event.startDate : todayIso;
  for (let cursor = from; cursor <= event.endDate; cursor = addDays(cursor, 1)) {
    if (eventOccursOn(event, cursor)) return cursor;
  }
  return null;
}

/** How many days the event spans, inclusive. A single day is 1. */
export function spanInDays(event) {
  return daysBetween(event.startDate, event.endDate) + 1;
}

/** Whether the event is open on at least one day inside the inclusive range. */
export function occursInRange(event, fromIso, toIso) {
  if (toIso < event.startDate || fromIso > event.endDate) return false;
  const from = fromIso > event.startDate ? fromIso : event.startDate;
  const to = toIso < event.endDate ? toIso : event.endDate;
  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
    if (eventOccursOn(event, cursor)) return true;
  }
  return false;
}

/**
 * The date filters offered on the site, derived from today so they never go
 * stale. The previous implementation stored a hardcoded season on every record
 * ("weekend" meaning 7月末まで, plus "august" and "september"), which stopped
 * making sense the moment September arrived.
 */
export function datePresets(todayIso) {
  const weekday = weekdayOf(todayIso);
  const saturday = weekday === 0 ? addDays(todayIso, -1) : addDays(todayIso, 6 - weekday);
  const sunday = addDays(saturday, 1);
  const [year, month] = todayIso.split("-").map(Number);
  const endOfMonth = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  const startOfNextMonth = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const endOfNextMonth = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
  const nextMonthLabel = `${Number(startOfNextMonth.slice(5, 7))}月`;

  return [
    {
      id: "weekend",
      label: "今週末",
      from: saturday > todayIso ? saturday : todayIso,
      to: sunday,
    },
    { id: "this-month", label: "今月中", from: todayIso, to: endOfMonth },
    { id: "next-month", label: nextMonthLabel, from: startOfNextMonth, to: endOfNextMonth },
  ];
}

/**
 * Display parts for the date block on a card, derived from the structured dates
 * so the two can never disagree.
 *
 *   single day            { month: "7",   day: "24" }
 *   range, one month      { month: "8",   day: "1–2" }
 *   range, across months  { span: { from: "7/4", to: "9/17" } }
 *   recurring, one month  { month: "8",   day: "2・9・23・30" }
 *   recurring, across     { month: "7–8", day: "7/30・8/8・18" }
 *
 * A range that crosses a month boundary used to render as "7–9月" above "4–17",
 * which asks the reader to combine the two and looks like the 4th to the 17th.
 * It now carries the month on both ends and the card stacks them.
 *
 * A recurring series that crosses a boundary has the same problem — in
 * "7–8月 / 30・8・18" there is no way to tell which day belongs to which month —
 * so the month is repeated whenever it changes.
 *
 * A long recurring series falls back to first–last, because the date block is a
 * single large numeral and spelling out thirteen days is unreadable. The nuance
 * lives in `dateNote` instead.
 */
const MAX_LISTED_DAYS = 5;

const monthOf = (iso) => String(Number(iso.slice(5, 7)));
const dayOf = (iso) => String(Number(iso.slice(8, 10)));

export function formatEventDate(event) {
  const startMonth = monthOf(event.startDate);
  const endMonth = monthOf(event.endDate);
  const crossesMonths = startMonth !== endMonth;
  const month = crossesMonths ? `${startMonth}–${endMonth}` : startMonth;

  if (event.dates && event.dates.length <= MAX_LISTED_DAYS) {
    if (!crossesMonths) {
      return { month, day: event.dates.map(dayOf).join("・") };
    }
    let previousMonth = null;
    const parts = event.dates.map((date) => {
      const m = monthOf(date);
      const label = m === previousMonth ? dayOf(date) : `${m}/${dayOf(date)}`;
      previousMonth = m;
      return label;
    });
    return { month, day: parts.join("・") };
  }

  if (event.startDate === event.endDate) {
    return { month, day: dayOf(event.startDate) };
  }

  if (crossesMonths) {
    return {
      month,
      day: `${startMonth}/${dayOf(event.startDate)}–${endMonth}/${dayOf(event.endDate)}`,
      span: {
        from: `${startMonth}/${dayOf(event.startDate)}`,
        to: `${endMonth}/${dayOf(event.endDate)}`,
      },
    };
  }

  return { month, day: `${dayOf(event.startDate)}–${dayOf(event.endDate)}` };
}

/**
 * The same dates as a sentence, for the card's accessible name. The visual block
 * splits the date across elements and drops the "月"/"日" markers, which does not
 * read well aloud.
 */
export function describeEventDate(event) {
  const jp = (iso) => `${monthOf(iso)}月${dayOf(iso)}日`;

  if (event.dates && event.dates.length <= MAX_LISTED_DAYS) {
    return event.dates.map(jp).join("・");
  }
  if (event.startDate === event.endDate) return jp(event.startDate);
  return `${jp(event.startDate)}から${jp(event.endDate)}まで`;
}
