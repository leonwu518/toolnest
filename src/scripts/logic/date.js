/* 日期计算纯逻辑（统一按 UTC 处理，避免时区造成差一天） */
const DAY = 86400000;

export function toUTC(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ''));
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return date;
}

export function formatISO(date) {
  return date.toISOString().slice(0, 10);
}

export function countWeekdays(startStr, endStr) {
  const start = toUTC(startStr), end = toUTC(endStr);
  if (!start || !end) return null;
  const sign = end >= start ? 1 : -1;
  const total = Math.min(Math.round(Math.abs(end - start) / DAY), 20000);
  let weekdays = 0, weekends = 0;
  const cursor = new Date(sign === 1 ? start : end);
  for (let i = 0; i < total; i++) {
    const day = cursor.getUTCDay();
    if (day === 0 || day === 6) weekends++; else weekdays++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return { weekdays: weekdays * sign, weekends: weekends * sign };
}

export function dateDiff(startStr, endStr, includeEnd = false) {
  const start = toUTC(startStr), end = toUTC(endStr);
  if (!start || !end) return null;
  const raw = Math.round((end - start) / DAY);
  const days = raw + (includeEnd ? (raw >= 0 ? 1 : -1) : 0);
  const counts = countWeekdays(startStr, endStr) || { weekdays: 0, weekends: 0 };
  return {
    days,
    weeks: days / 7,
    months: days / 30.4375,
    years: days / 365.25,
    weekdays: counts.weekdays,
    weekendDays: counts.weekends,
  };
}

export function addDays(dateStr, days, direction = 'add') {
  const date = toUTC(dateStr);
  const n = Number(days);
  if (!date || !Number.isFinite(n)) return null;
  const delta = (direction === 'subtract' ? -1 : 1) * Math.trunc(n);
  const result = new Date(date.getTime() + delta * DAY);
  return { date: formatISO(result), weekday: result.getUTCDay() };
}
