import { describe, expect, it, vi } from "vitest";
import { applyAmountInput, formatAmountInput } from "./format";

describe("formatAmountInput", () => {
  it("groups thousands as typed and keeps the caret where the student was editing", () => {
    expect(formatAmountInput("1200000", 7)).toEqual({ text: "1,200,000", caret: 9 });
    // A 5 typed after "1,2" in "1,200,000": the caret must stay after the 5 (index 4),
    // not jump to the end of the grouped text.
    expect(formatAmountInput("1,2500,000", 4)).toEqual({ text: "12,500,000", caret: 4 });
  });

  it("keeps the caret in place when a leading zero sits before it", () => {
    // Zeros are not stripped, so the caret after "01" stays after "01", not after "1,00".
    expect(formatAmountInput("01000", 2)).toEqual({ text: "01,000", caret: 2 });
  });

  it("leaves a second decimal point and other characters as typed", () => {
    expect(formatAmountInput("1.5.3", 5)).toEqual({ text: "1.5.3", caret: 5 });
  });
});

describe("applyAmountInput", () => {
  function fakeInput(value: string, selectionStart: number | null) {
    return {
      value,
      selectionStart,
      setSelectionRange: vi.fn(),
    };
  }

  it("writes the grouped text and the caret back to the element, then reports it", () => {
    const input = fakeInput("1200000", 7);
    const onChange = vi.fn();
    applyAmountInput(input, onChange);
    expect(input.value).toBe("1,200,000");
    expect(input.setSelectionRange).toHaveBeenCalledWith(9, 9);
    expect(onChange).toHaveBeenCalledWith("1,200,000");
  });

  it("keeps the caret after a digit typed in the middle of a grouped number", () => {
    const input = fakeInput("1,2500,000", 4);
    const onChange = vi.fn();
    applyAmountInput(input, onChange);
    expect(input.value).toBe("12,500,000");
    expect(input.setSelectionRange).toHaveBeenCalledWith(4, 4);
    expect(onChange).toHaveBeenCalledWith("12,500,000");
  });

  it("falls back to the end of the text when the element reports no caret", () => {
    const input = fakeInput("5000", null);
    applyAmountInput(input, vi.fn());
    expect(input.setSelectionRange).toHaveBeenCalledWith(5, 5);
  });
});
