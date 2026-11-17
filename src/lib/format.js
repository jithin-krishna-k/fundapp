const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const money2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plain = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹1,23,456 */
export function inr(value) {
  return money.format(Number(value) || 0);
}

/** ₹1,23,456.50 */
export function inrExact(value) {
  return money2.format(Number(value) || 0);
}

/** 1,23,456 */
export function num(value) {
  return plain.format(Number(value) || 0);
}

/** 16 നവംബർ 2026 */
export function formatDate(value, locale = "en-IN") {
  if (!value) return "—";
  const d = parseDay(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

/** Monday-of-week helpers (IST-neutral, ISO weeks) */
/**
 * A Date for a calendar day. "YYYY-MM-DD" strings are read as local midnight
 * (new Date("2026-11-16") would be UTC midnight, a different local day in some zones).
 */
export function parseDay(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

/** First day of the week containing `date`. startDay: 0 = Sunday … 6 = Saturday (default Monday). */
export function startOfWeek(date = new Date(), startDay = 1) {
  const d = parseDay(date);
  const first = Number.isInteger(Number(startDay)) ? ((Number(startDay) % 7) + 7) % 7 : 1;
  const diff = (d.getDay() - first + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = parseDay(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** The local calendar day as "YYYY-MM-DD" (not UTC, which shifts Indian midnight to the day before). */
export function isoDate(date) {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole weeks between two dates (floor). */
export function weeksBetween(from, to) {
  const a = new Date(from);
  const b = new Date(to);
  const ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}

/** Days late beyond the due date. */
export function daysLate(dueDate, today = new Date()) {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((now - due) / (24 * 60 * 60 * 1000)));
}