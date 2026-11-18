import { describe, expect, it } from "vitest";
import { HIJRI_CALENDARS, buildIcs, daysInHijriMonth, formatHijri, nextHawl, toGregorian, toHijri, upcomingHawls } from "./hijri";

const ms = (g: { year: number; month: number; day: number }) => Date.UTC(g.year, g.month - 1, g.day);

describe("toHijri and toGregorian", () => {
  it("puts 1 Ramadan 1446 on 1 March 2025 in both calendars", () => {
    for (const { id } of HIJRI_CALENDARS) {
      expect(toHijri({ year: 2025, month: 3, day: 1 }, id)).toEqual({ year: 1446, month: 9, day: 1 });
      expect(toGregorian({ year: 1446, month: 9, day: 1 }, id)).toEqual({ year: 2025, month: 3, day: 1 });
    }
  });

  it("round-trips every day across several Hijri years, including the year boundary", () => {
    for (const { id } of HIJRI_CALENDARS) {
      for (let t = Date.UTC(2024, 0, 1); t < Date.UTC(2027, 0, 1); t += 86_400_000) {
        const d = new Date(t);
        const g = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
        expect(toGregorian(toHijri(g, id), id)).toEqual(g);
      }
    }
  });

  it("returns null for a day the month does not have", () => {
    const short = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find((m) => daysInHijriMonth(1446, m) === 29);
    expect(short).toBeDefined();
    expect(toGregorian({ year: 1446, month: short as number, day: 30 })).toBeNull();
  });

  it("has months of 29 or 30 days", () => {
    for (let m = 1; m <= 12; m++) expect([29, 30]).toContain(daysInHijriMonth(1447, m));
  });
});

describe("nextHawl", () => {
  const start = { month: 9, day: 1 }; // 1 Ramadan

  it("counts today when today is the day", () => {
    const r = nextHawl(start, { year: 2025, month: 3, day: 1 });
    expect(r.gregorian).toEqual({ year: 2025, month: 3, day: 1 });
    expect(r.hijri.year).toBe(1446);
  });

  it("moves to the following Hijri year once the day has passed, 354 or 355 days on", () => {
    const r = nextHawl(start, { year: 2025, month: 3, day: 2 });
    expect(r.hijri).toEqual({ year: 1447, month: 9, day: 1 });
    const days = (ms(r.gregorian) - Date.UTC(2025, 2, 1)) / 86_400_000;
    expect(days).toBeGreaterThanOrEqual(353);
    expect(days).toBeLessThanOrEqual(355);
  });

  it("crosses a Hijri year boundary: from Dhu al-Hijjah to a Muharram date", () => {
    const lastMonth = toGregorian({ year: 1446, month: 12, day: 15 });
    expect(lastMonth).not.toBeNull();
    const r = nextHawl({ month: 1, day: 10 }, lastMonth!);
    expect(r.hijri).toEqual({ year: 1447, month: 1, day: 10 });
  });

  it("is always on or after the day asked from, for every month", () => {
    const from = { year: 2025, month: 11, day: 18 };
    for (let month = 1; month <= 12; month++) {
      for (const day of [1, 15, 29, 30]) {
        const r = nextHawl({ month, day }, from);
        expect(ms(r.gregorian)).toBeGreaterThanOrEqual(ms(from));
        expect(r.hijri.month).toBe(month);
        expect(r.hijri.day).toBeLessThanOrEqual(day);
      }
    }
  });

  it("falls on the last day of a 29-day month rather than skipping it", () => {
    for (let m = 1; m <= 12; m++) {
      if (daysInHijriMonth(1447, m) === 29) {
        const r = nextHawl({ month: m, day: 30 }, toGregorian({ year: 1447, month: m, day: 1 })!);
        expect(r.hijri).toEqual({ year: 1447, month: m, day: 29 });
        return;
      }
    }
    throw new Error("no 29-day month found in 1447");
  });
});

describe("upcomingHawls", () => {
  it("returns consecutive Hijri years", () => {
    const r = upcomingHawls({ month: 9, day: 1 }, { year: 2025, month: 3, day: 2 }, 4);
    expect(r.map((x) => x.hijri.year)).toEqual([1447, 1448, 1449, 1450]);
  });
});

describe("formatHijri", () => {
  it("names the month", () => {
    expect(formatHijri({ year: 1446, month: 9, day: 1 })).toBe("1 Ramadan 1446 AH");
  });
});

describe("buildIcs", () => {
  const stamp = new Date(Date.UTC(2025, 0, 2, 3, 4, 5));
  const ics = buildIcs([{ uid: "a@zakat-kit", date: { year: 2025, month: 12, day: 31 }, summary: "Zakat date, 1 Ramadan", description: "Check; then pay, if due." }], stamp);

  it("is a calendar with CRLF line ends", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("makes an all-day event ending the next day, across a year end", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20251231\r\n");
    expect(ics).toContain("DTEND;VALUE=DATE:20260101\r\n");
    expect(ics).toContain("DTSTAMP:20250102T030405Z\r\n");
  });

  it("escapes commas and semicolons", () => {
    expect(ics).toContain("DESCRIPTION:Check\\; then pay\\, if due.\r\n");
  });

  it("folds long lines to 75 octets and never repeats yearly", () => {
    const long = buildIcs([{ uid: "b", date: { year: 2025, month: 1, day: 1 }, summary: "x".repeat(200) }], stamp);
    for (const line of long.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(long).not.toContain("RRULE");
  });
});
