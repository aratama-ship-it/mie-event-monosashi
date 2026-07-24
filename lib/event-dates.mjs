function isoFromParts(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toISOString().slice(0, 10);
}

/**
 * Returns whether an event is taking place on a date.
 *
 * Continuous ranges use an en dash (31–01 or 7–9月 / 25–27日).
 * Discrete dates use a middle dot (2・9・23・30).
 *
 * @param {{ isoDate: string; month: string; day: string }} event
 * @param {string} targetDate
 */
export function eventOccursOn(event, targetDate) {
  if (event.day.includes("・")) {
    const [year, startMonth] = event.isoDate.split("-").map(Number);
    const monthParts = event.month.split("–").map(Number);
    const finalMonth = monthParts.at(-1) ?? startMonth;
    let currentMonth = startMonth;
    let previousDay = 0;

    return event.day.split("・").some((part) => {
      const day = Number(part);
      if (previousDay && day < previousDay && currentMonth < finalMonth) {
        currentMonth += 1;
      }
      previousDay = day;
      return isoFromParts(year, currentMonth, day) === targetDate;
    });
  }

  if (event.day.includes("–")) {
    const [year, startMonth] = event.isoDate.split("-").map(Number);
    const [startDay, endDay] = event.day.split("–").map(Number);
    const monthParts = event.month.split("–").map(Number);
    let endMonth = monthParts.at(-1) ?? startMonth;
    let endYear = year;

    if (monthParts.length === 1 && endDay < startDay) {
      endMonth += 1;
      if (endMonth > 12) {
        endMonth = 1;
        endYear += 1;
      }
    }

    const endDate = isoFromParts(endYear, endMonth, endDay);
    return targetDate >= event.isoDate && targetDate <= endDate;
  }

  return event.isoDate === targetDate;
}
