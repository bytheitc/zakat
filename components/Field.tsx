"use client";

import { useId } from "react";

/**
 * A labelled money input.
 *
 * The label is wired up explicitly with `htmlFor` and the hint with
 * `aria-describedby`, rather than relying on wrapping the input in a
 * `<label>`. Wrapping does associate the two, but the accessible name then
 * becomes every scrap of text inside the label run together — a screen
 * reader announced the first field as "CashIn hand, current account, mobile
 * money₦", which is the sort of thing that only turns up if you go and look.
 * Splitting them makes the name "Cash", with the hint read after it as a
 * hint.
 */
export function Field({
  label,
  hint,
  value,
  onChange,
  prefix,
  suffix,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
          {hint}
        </p>
      )}
      <div className="mt-1 flex items-center gap-1 rounded border border-[var(--color-rule)] px-2 focus-within:border-[var(--color-brand)]">
        {prefix && (
          <span aria-hidden className="text-sm text-[var(--color-ink-soft)]">
            {prefix}
          </span>
        )}
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hint ? hintId : undefined}
          // `inputMode` rather than `type="number"`: a number input brings up
          // a spinner nobody wants on mobile and silently rejects pasted
          // values containing commas — and people do paste "1,200,000"
          // straight out of their bank app.
          inputMode="decimal"
          className="w-full bg-transparent py-1.5 text-sm tabular-nums outline-none"
        />
        {suffix && (
          <span className="shrink-0 text-xs text-[var(--color-ink-soft)]">{suffix}</span>
        )}
      </div>
    </div>
  );
}
