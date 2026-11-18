"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Download } from "lucide-react";
import { usePersistentState } from "@/lib/persist";
import {
  DEFAULT_HIJRI_CALENDAR,
  HIJRI_CALENDARS,
  HIJRI_MONTHS,
  buildIcs,
  formatHijri,
  toHijri,
  upcomingHawls,
  type CivilDate,
  type HijriCalendar,
} from "@/lib/hijri";

/** How many years of reminders the calendar file holds. Each is worked out separately, so none drifts. */
const ICS_YEARS = 5;

const GREGORIAN_FORMAT = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" });

function show(d: CivilDate): string {
  return GREGORIAN_FORMAT.format(new Date(Date.UTC(d.year, d.month - 1, d.day)));
}

interface Start {
  /** 0 means not set yet. */
  readonly month: number;
  readonly day: number;
}

/**
 * The person's own hawl: the Hijri day their zakat year begins, and when it
 * next comes round. The date is the person's to enter; nothing here decides
 * when zakat is due, and the dates can differ by a day from local moon sighting.
 */
export function HawlReminder() {
  const [start, setStart] = usePersistentState<Start>("hawl:start", { month: 0, day: 1 });
  const [calendar, setCalendar] = usePersistentState<HijriCalendar>("hawl:calendar", DEFAULT_HIJRI_CALENDAR);
  // Today is read after mount so the server and client markup agree.
  const [today, setToday] = useState<CivilDate | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const n = new Date();
      setToday({ year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate() });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const upcoming = useMemo(() => (today && start.month >= 1 ? upcomingHawls(start, today, ICS_YEARS, calendar) : []), [today, start, calendar]);
  const next = upcoming[0];

  function fromGregorian(value: string) {
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return;
    const h = toHijri({ year: y, month: m, day: d }, calendar);
    setStart({ month: h.month, day: h.day });
  }

  function download() {
    const monthName = HIJRI_MONTHS[start.month - 1];
    const ics = buildIcs(
      upcoming.map((u) => ({
        uid: `hawl-${u.hijri.year}-${start.month}-${start.day}@zakat-kit`,
        date: u.gregorian,
        summary: `Zakat year turns: ${formatHijri(u.hijri)}`,
        description: `Your zakat year began on ${start.day} ${monthName}. The date can differ by a day from local moon sighting. Zakat Kit is a calculator, not a ruling.`,
      })),
      new Date()
    );
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "zakat-year.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="hawl-reminder-title">
      <div className="flex items-start gap-3">
        <CalendarClock aria-hidden className="mt-1 size-5 shrink-0 text-[var(--color-brand)]" />
        <div>
          <h2 id="hawl-reminder-title" className="text-xl font-extrabold">Your zakat year</h2>
          <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">Optional. Enter the Hijri day your zakat year begins to see when it comes round next.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="hawl-month" className="text-sm font-medium">Hijri month</label>
          <select id="hawl-month" value={start.month} onChange={(e) => setStart({ ...start, month: Number(e.target.value) })} className="mt-1.5 w-full rounded-xl border border-[var(--color-rule)] bg-transparent px-3 py-2.5 text-sm">
            <option value={0}>Choose a month</option>
            {HIJRI_MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="hawl-day" className="text-sm font-medium">Day</label>
          <select id="hawl-day" value={start.day} onChange={(e) => setStart({ ...start, day: Number(e.target.value) })} className="mt-1.5 w-full rounded-xl border border-[var(--color-rule)] bg-transparent px-3 py-2.5 text-sm">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="hawl-calendar" className="text-sm font-medium">Calendar</label>
          <select id="hawl-calendar" value={calendar} onChange={(e) => setCalendar(e.target.value as HijriCalendar)} className="mt-1.5 w-full rounded-xl border border-[var(--color-rule)] bg-transparent px-3 py-2.5 text-sm">
            {HIJRI_CALENDARS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor="hawl-gregorian" className="text-sm font-medium">Or pick it from a Gregorian date</label>
        <input id="hawl-gregorian" type="date" onChange={(e) => fromGregorian(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[var(--color-rule)] bg-transparent px-3 py-2.5 text-sm sm:w-auto" />
      </div>

      {next && (
        <div className="mt-4 rounded-xl bg-[var(--color-wash)] p-4 text-sm" aria-live="polite">
          <p className="eyebrow">Next</p>
          <p className="mt-1 font-semibold">{formatHijri(next.hijri)}</p>
          <p className="text-[var(--color-ink-soft)]">About {show(next.gregorian)}</p>
        </div>
      )}

      <p className="mt-3 text-xs text-[var(--color-ink-soft)]">
        Dates are worked out by calendar rules, not by sighting the moon, so the month may begin a day earlier or later where you live.
      </p>

      {next && (
        <button type="button" onClick={download} className="btn btn-sm mt-4">
          <Download className="size-4" /> Add the next {ICS_YEARS} years to my calendar (.ics)
        </button>
      )}
    </section>
  );
}
