import { describe, expect, it } from "vitest";
import {
  type Allowance,
  dailyAllowance,
  daysLeftInMonth,
  splitAllowance,
} from "./budget";

const allowance = (over: Partial<Allowance> = {}): Allowance => ({
  monthlyIncome: 100_000,
  fixedCosts: 40_000,
  sadaqahShare: 0.05,
  savingsShare: 0.2,
  ...over,
});

describe("splitAllowance", () => {
  it("applies shares to what is left after fixed costs, not to gross income", () => {
    // Applying them to gross would ask a student whose rent eats most of
    // their allowance to save a tenth of money that does not exist.
    const split = splitAllowance(allowance());
    expect(split.surplus).toBe(60_000);
    expect(split.sadaqah).toBeCloseTo(3_000, 6);
    expect(split.savings).toBeCloseTo(12_000, 6);
    expect(split.spending).toBeCloseTo(45_000, 6);
  });

  it("accounts for every naira", () => {
    const split = splitAllowance(allowance());
    expect(split.fixedCosts + split.sadaqah + split.savings + split.spending).toBeCloseTo(
      100_000,
      6
    );
  });

  it("flags overspending instead of hiding it", () => {
    const split = splitAllowance(allowance({ monthlyIncome: 30_000 }));
    expect(split.overspent).toBe(true);
    expect(split.surplus).toBe(-10_000);
    expect(split.spending).toBe(0);
  });

  it("treats breaking exactly even as overspent — there is nothing to split", () => {
    const split = splitAllowance(allowance({ monthlyIncome: 40_000 }));
    expect(split.overspent).toBe(true);
  });

  it("clamps shares outside 0 to 1 rather than producing nonsense", () => {
    expect(splitAllowance(allowance({ savingsShare: 5 })).savings).toBe(60_000);
    expect(splitAllowance(allowance({ sadaqahShare: -1 })).sadaqah).toBe(0);
    expect(splitAllowance(allowance({ savingsShare: NaN })).savings).toBe(0);
  });

  it("never pushes spending below zero when the shares total more than one", () => {
    const split = splitAllowance(allowance({ sadaqahShare: 0.8, savingsShare: 0.8 }));
    expect(split.spending).toBe(0);
  });
});

describe("dailyAllowance", () => {
  it("divides what is left by the days that remain", () => {
    expect(dailyAllowance(45_000, 15_000, 10)).toBe(3_000);
  });

  it("is zero, not negative, once the budget is gone", () => {
    expect(dailyAllowance(45_000, 50_000, 10)).toBe(0);
  });

  it("does not divide by zero on the last day", () => {
    expect(dailyAllowance(45_000, 0, 0)).toBe(0);
  });
});

describe("daysLeftInMonth", () => {
  it("counts today", () => {
    expect(daysLeftInMonth(new Date(2026, 9, 31))).toBe(1);
    expect(daysLeftInMonth(new Date(2026, 9, 1))).toBe(31);
  });

  it("handles a 30-day month", () => {
    expect(daysLeftInMonth(new Date(2026, 10, 1))).toBe(30);
  });

  it("handles a leap February", () => {
    expect(daysLeftInMonth(new Date(2028, 1, 1))).toBe(29);
  });
});
