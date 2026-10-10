// Shared date and URL logic, executed locally in the content script's isolated world.
const crosswordDates = (() => {
  "use strict";
  const puzzles = {
    mini: { minDate: { year: 2014, month: 8, day: 21 } },
    daily: { minDate: { year: 1993, month: 11, day: 21 } },
    // Do not guess the earliest playable Midi archive date.
    midi: { minDate: null }
  };
  function isCalendarDate(value) {
    if (!value) return false;
    const { year, month, day } = value;
    if (![year, month, day].every(Number.isInteger) || year < 1900) return false;
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }
  function parsePath(pathname) {
    const match = pathname.match(/^\/crosswords\/game\/(mini|midi|daily)(?:\/(\d{4})\/(\d{1,2})\/(\d{1,2}))?\/?$/);
    if (!match) return null;
    const date = match[2] ? { year: +match[2], month: +match[3], day: +match[4] } : null;
    if (date && !isCalendarDate(date)) return null;
    return { type: match[1], date };
  }
  function parseDateFromText(text) {
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const match = (text || "").match(/([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (!match) return null;
    const date = { year: +match[3], month: months.indexOf(match[1].toLowerCase()) + 1, day: +match[2] };
    return isCalendarDate(date) ? date : null;
  }
  function parseFilename(filename, type) {
    const match = typeof filename === "string" && filename.match(/(?:^|\/)(mini|midi|daily)\/(\d{4})-(\d{2})-(\d{2})(?:\.[a-z]+)?$/);
    if (!match || match[1] !== type) return null;
    const date = { year: +match[2], month: +match[3], day: +match[4] };
    return isCalendarDate(date) ? date : null;
  }
  function shiftDate(current, unit, delta) {
    if (!isCalendarDate(current) || !Number.isInteger(delta)) return null;
    let { year, month, day } = current;
    if (unit === "day") {
      const date = new Date(year, month - 1, day + delta);
      return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
    }
    if (unit === "year") year += delta;
    else if (unit === "month") {
      const date = new Date(year, month - 1 + delta, 1);
      year = date.getFullYear();
      month = date.getMonth() + 1;
    } else return null;
    day = Math.min(day, new Date(year, month, 0).getDate());
    return { year, month, day };
  }
  function isDateValid(type, date, today = new Date()) {
    if (!Object.hasOwn(puzzles, type) || !isCalendarDate(date)) return false;
    const target = new Date(date.year, date.month - 1, date.day);
    const max = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const min = puzzles[type].minDate;
    return target <= max && (!min || target >= new Date(min.year, min.month - 1, min.day));
  }
  function buildUrl(type, date) {
    if (!Object.hasOwn(puzzles, type) || !isCalendarDate(date)) return null;
    return `https://www.nytimes.com/crosswords/game/${type}/${date.year}/${String(date.month).padStart(2, "0")}/${String(date.day).padStart(2, "0")}`;
  }
  return { parsePath, parseDateFromText, parseFilename, shiftDate, isDateValid, buildUrl };
})();
