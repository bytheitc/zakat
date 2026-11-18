/**
 * Hijri dates for the hawl reminder, as pure functions.
 *
 * Zakat is due once wealth has been held a full lunar year, so a person wants
 * to know when their own year turns. The conversion uses the Islamic calendars
 * built into the browser's Intl, which compute the date arithmetically (or
 * from tables); they do not look at the moon. A month can therefore start a
 * day earlier or later than where the person lives actually sights it, so
 * every date from here is "about", and the interface says so.
 *
 * Which calendar to use is a choice, not a default we hide: see HIJRI_CALENDARS.
 */

export type HijriCalendar = "islamic-umalqura" | "islamic-civil";

export const HIJRI_CALENDARS: readonly { readonly id: HijriCalendar; readonly name: string }[] = [
  { id: "islamic-umalqura", name: "Umm al-Qura (Saudi Arabia)" },
  { id: "islamic-civil", name: "Tabular civil" },
];

export const DEFAULT_HIJRI_CALENDAR: HijriCalendar = "islamic-umalqura";

export const HIJRI_MONTHS: readonly string[] = [
  "Muharram",
  "Safar",
  "Rabi' al-awwal",
  "Rabi' al-thani",
  "Jumada al-ula",
  "Jumada al-akhirah",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qa'dah",
  "Dhu al-Hijjah",
];

export interface HijriDate {
  readonly year: number;
  /** 1 to 12. */
  readonly month: number;
  /** 1 to 30. */
  readonly day: number;
}

/** A Gregorian calendar day, with no time of day and no time zone. */
export interface CivilDate {
  readonly year: number;
  /** 1 to 12. */
  readonly month: number;
  readonly day: number;
}

const DAY_MS = 86_400_000;

function utc(d: CivilDate): number {
  const t = new Date(0);
  t.setUTCFullYear(d.year, d.month - 1, d.day);
  t.setUTCHours(0, 0, 0, 0);
  return t.getTime();
}

function fromUtc(ms: number): CivilDate {
  const t = new Date(ms);
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
}

function formatter(calendar: HijriCalendar): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(`en-u-ca-${calendar}`, { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" });
}

/** The Hijri date that falls on a Gregorian day. */
export function toHijri(date: CivilDate, calendar: HijriCalendar = DEFAULT_HIJRI_CALENDAR): HijriDate {
  const parts = formatter(calendar).formatToParts(new Date(utc(date)));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * The Gregorian day a Hijri date falls on, or null if the calendar has no such
 * day (the 30th of a 29-day month).
 *
 * Intl only converts forwards, so this estimates from the average length of a
 * Hijri month and then walks day by day until the forward conversion agrees.
 * The estimate is within a couple of days; the walk covers a generous margin.
 */
export function toGregorian(h: HijriDate, calendar: HijriCalendar = DEFAULT_HIJRI_CALENDAR): CivilDate | null {
  const HIJRI_EPOCH_MS = Date.UTC(622, 6, 16);
  const MEAN_MONTH_DAYS = 29.530588;
  const monthsSinceEpoch = (h.year - 1) * 12 + (h.month - 1);
  const guess = HIJRI_EPOCH_MS + Math.round(monthsSinceEpoch * MEAN_MONTH_DAYS + (h.day - 1)) * DAY_MS;
  for (let offset = 0; offset <= 45; offset++) {
    for (const sign of offset === 0 ? [1] : [1, -1]) {
      const candidate = fromUtc(guess + sign * offset * DAY_MS);
      const back = toHijri(candidate, calendar);
      if (back.year === h.year && back.month === h.month && back.day === h.day) return candidate;
    }
  }
  return null;
}

/** Days in a Hijri month (29 or 30) in the chosen calendar. */
export function daysInHijriMonth(year: number, month: number, calendar: HijriCalendar = DEFAULT_HIJRI_CALENDAR): number {
  return toGregorian({ year, month, day: 30 }, calendar) ? 30 : 29;
}

/**
 * The next time a Hijri month and day come round, counting today if it is the
 * day. A zakat year that began on the 30th of a month whose next occurrence
 * only has 29 days falls on that month's last day, not skipped.
 */
export function nextHawl(
  start: { readonly month: number; readonly day: number },
  from: CivilDate,
  calendar: HijriCalendar = DEFAULT_HIJRI_CALENDAR
): { readonly hijri: HijriDate; readonly gregorian: CivilDate } {
  const today = toHijri(from, calendar);
  const fromMs = utc(from);
  for (let year = today.year; year <= today.year + 2; year++) {
    const day = Math.min(start.day, daysInHijriMonth(year, start.month, calendar));
    const g = toGregorian({ year, month: start.month, day }, calendar);
    if (g && utc(g) >= fromMs) return { hijri: { year, month: start.month, day }, gregorian: g };
  }
  // Unreachable for months 1 to 12; kept so a bad month cannot loop or crash.
  throw new RangeError(`No such Hijri month: ${start.month}`);
}

/** The next `count` anniversaries, each worked out on its own so none drifts. */
export function upcomingHawls(
  start: { readonly month: number; readonly day: number },
  from: CivilDate,
  count: number,
  calendar: HijriCalendar = DEFAULT_HIJRI_CALENDAR
): { readonly hijri: HijriDate; readonly gregorian: CivilDate }[] {
  const out: { readonly hijri: HijriDate; readonly gregorian: CivilDate }[] = [];
  let cursor = from;
  for (let i = 0; i < count; i++) {
    const next = nextHawl(start, cursor, calendar);
    out.push(next);
    cursor = fromUtc(utc(next.gregorian) + DAY_MS);
  }
  return out;
}

export function formatHijri(h: HijriDate): string {
  return `${h.day} ${HIJRI_MONTHS[h.month - 1] ?? h.month} ${h.year} AH`;
}

/* ---------------------------- calendar file ---------------------------- */

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

function icsDate(d: CivilDate): string {
  return `${pad(d.year, 4)}${pad(d.month)}${pad(d.day)}`;
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** RFC 5545: lines are at most 75 octets; a longer one continues on a line starting with a space. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let limit = 75;
  for (const ch of line) {
    if (encoder.encode(current + ch).length > limit) {
      out.push(current);
      current = "";
      limit = 74; // the leading space counts
    }
    current += ch;
  }
  out.push(current);
  return out.join("\r\n ");
}

export interface IcsEvent {
  readonly uid: string;
  readonly date: CivilDate;
  readonly summary: string;
  readonly description?: string;
}

/**
 * An iCalendar file of all-day events. Each date is given explicitly rather
 * than as a yearly repeat: a Gregorian repeat drifts about eleven days a year
 * against the Hijri calendar, so a repeat would remind on the wrong day.
 * `stamp` is the creation time (UTC) and is passed in so the output is testable.
 */
export function buildIcs(events: readonly IcsEvent[], stamp: Date): string {
  const dtstamp = `${pad(stamp.getUTCFullYear(), 4)}${pad(stamp.getUTCMonth() + 1)}${pad(stamp.getUTCDate())}T${pad(stamp.getUTCHours())}${pad(stamp.getUTCMinutes())}${pad(stamp.getUTCSeconds())}Z`;
  const lines: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Zakat Kit//Hawl reminder//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${icsDate(e.date)}`,
      `DTEND;VALUE=DATE:${icsDate(fromUtc(utc(e.date) + DAY_MS))}`,
      `SUMMARY:${escapeText(e.summary)}`
    );
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    lines.push("TRANSP:TRANSPARENT", "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapeText(e.summary)}`, "TRIGGER:-P1D", "END:VALARM", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
