/**
 * Groups a money amount as it is typed, and works out where the caret goes in
 * the grouped text.
 *
 * The caret is tracked by counting the characters before it that are not
 * commas, not by its raw offset. Inserting a comma shifts every character after
 * it, so the raw offset points at the wrong place once grouping has happened,
 * and the caret jumps. Counting the other characters survives the shift.
 *
 * Nothing else is changed: leading zeros, stray letters and a second decimal
 * point stay as typed, so the student sees exactly what they wrote and the
 * parser sees the same number it always did.
 */
export function formatAmountInput(
  raw: string,
  caret: number,
): { text: string; caret: number } {
  const stripped = raw.replace(/,/g, "");
  const dot = stripped.indexOf(".");
  const whole = dot < 0 ? stripped : stripped.slice(0, dot);
  const rest = dot < 0 ? "" : stripped.slice(dot);

  // Only a plain run of digits is grouped; anything else is left alone.
  const grouped = /^\d+$/.test(whole) ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : whole;
  const text = grouped + rest;

  const significantBefore = raw.slice(0, caret).replace(/,/g, "").length;

  let position = 0;
  let counted = 0;
  while (counted < significantBefore && position < text.length) {
    if (text[position] !== ",") counted++;
    position++;
  }
  return { text, caret: position };
}

/** The part of an input element the amount handler reads and writes. */
export type AmountInputTarget = {
  value: string;
  selectionStart: number | null;
  setSelectionRange(start: number, end: number): void;
};

/**
 * Applies `formatAmountInput` to an input element after a change, then reports
 * the grouped text up to the parent. Kept out of the component so the wiring can
 * be tested without a DOM.
 */
export function applyAmountInput(
  target: AmountInputTarget,
  onChange: (text: string) => void,
): void {
  const { text, caret } = formatAmountInput(
    target.value,
    target.selectionStart ?? target.value.length,
  );
  target.value = text;
  target.setSelectionRange(caret, caret);
  onChange(text);
}
