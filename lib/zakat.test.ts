import { describe, expect, it } from "vitest";
import {
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
  SAA_KILOGRAMS,
  ZAKAT_RATE,
  ZAKAT_RATE_SOLAR_YEAR,
  type ZakatInput,
  computeZakat,
  formatNaira,
  nisabValue,
  zakatAlFitr,
} from "./zakat";

const input = (over: Partial<ZakatInput> = {}): ZakatInput => ({
  assets: { cash: 0, savings: 0, preciousMetals: 0, receivables: 0, tradeGoods: 0 },
  liabilities: { immediateDebts: 0 },
  nisabBasis: "silver",
  goldPricePerGram: 150_000,
  silverPricePerGram: 1_800,
  ...over,
});

describe("nisabValue", () => {
  it("uses 85g for gold and 595g for silver", () => {
    expect(nisabValue(input({ nisabBasis: "gold" }))).toBe(NISAB_GOLD_GRAMS * 150_000);
    expect(nisabValue(input({ nisabBasis: "silver" }))).toBe(
      NISAB_SILVER_GRAMS * 1_800
    );
  });

  it("gives a lower threshold on silver at these prices, as it usually is", () => {
    // Which basis to use is a question for a scholar, not for this code — but
    // the silver threshold being the lower one is why the choice matters, and
    // it is worth pinning so nobody swaps the constants by accident.
    expect(nisabValue(input({ nisabBasis: "silver" }))).toBeLessThan(
      nisabValue(input({ nisabBasis: "gold" }))
    );
  });
});

describe("computeZakat", () => {
  it("adds up every asset category", () => {
    const result = computeZakat(
      input({
        assets: {
          cash: 100, savings: 200, preciousMetals: 300,
          receivables: 400, tradeGoods: 500,
        },
      })
    );
    expect(result.totalAssets).toBe(1500);
  });

  it("deducts debts due now", () => {
    const result = computeZakat(
      input({
        assets: { cash: 1000, savings: 0, preciousMetals: 0, receivables: 0, tradeGoods: 0 },
        liabilities: { immediateDebts: 400 },
      })
    );
    expect(result.netWealth).toBe(600);
  });

  it("returns exactly zero below nisab, not a small number", () => {
    const result = computeZakat(
      input({
        assets: { cash: 50_000, savings: 0, preciousMetals: 0, receivables: 0, tradeGoods: 0 },
      })
    );
    expect(result.meetsNisab).toBe(false);
    expect(result.zakatDue).toBe(0);
  });

  it("reports how far short you are when below the threshold", () => {
    const result = computeZakat(
      input({
        assets: { cash: 1_000_000, savings: 0, preciousMetals: 0, receivables: 0, tradeGoods: 0 },
      })
    );
    // Silver nisab here is 595 × 1800 = 1,071,000.
    expect(result.shortfall).toBe(71_000);
  });

  it("takes 2.5% once the threshold is met", () => {
    const result = computeZakat(
      input({
        assets: { cash: 2_000_000, savings: 0, preciousMetals: 0, receivables: 0, tradeGoods: 0 },
      })
    );
    expect(result.meetsNisab).toBe(true);
    expect(result.zakatDue).toBeCloseTo(2_000_000 * ZAKAT_RATE, 6);
    expect(result.shortfall).toBe(0);
  });

  it("counts wealth exactly at the threshold as meeting it", () => {
    const exact = 595 * 1_800;
    const result = computeZakat(
      input({
        assets: { cash: exact, savings: 0, preciousMetals: 0, receivables: 0, tradeGoods: 0 },
      })
    );
    expect(result.meetsNisab).toBe(true);
  });

  it("uses the higher rate when reckoning on a solar year", () => {
    const result = computeZakat(
      input({
        assets: { cash: 2_000_000, savings: 0, preciousMetals: 0, receivables: 0, tradeGoods: 0 },
        useSolarYearRate: true,
      })
    );
    expect(result.rate).toBe(ZAKAT_RATE_SOLAR_YEAR);
    expect(result.zakatDue).toBeGreaterThan(2_000_000 * ZAKAT_RATE);
  });

  it("does not report zakat due on negative net wealth", () => {
    const result = computeZakat(
      input({
        assets: { cash: 100, savings: 0, preciousMetals: 0, receivables: 0, tradeGoods: 0 },
        liabilities: { immediateDebts: 5_000 },
      })
    );
    expect(result.netWealth).toBeLessThan(0);
    expect(result.zakatDue).toBe(0);
  });

  it("carries its inputs in the result so the working can be shown", () => {
    const result = computeZakat(input({ nisabBasis: "gold" }));
    expect(result.nisabBasis).toBe("gold");
    expect(result.nisabValue).toBeGreaterThan(0);
  });
});

describe("zakatAlFitr", () => {
  it("is one sa' per person", () => {
    expect(zakatAlFitr(4, 2_000).kilograms).toBe(4 * SAA_KILOGRAMS);
  });

  it("prices the food at the given rate", () => {
    expect(zakatAlFitr(2, 2_000).cost).toBe(2 * SAA_KILOGRAMS * 2_000);
  });

  it("ignores a fractional or negative household", () => {
    expect(zakatAlFitr(2.7, 1_000).kilograms).toBe(2 * SAA_KILOGRAMS);
    expect(zakatAlFitr(-3, 1_000).kilograms).toBe(0);
  });
});

describe("formatNaira", () => {
  it("renders whole naira, no kobo", () => {
    const formatted = formatNaira(1_234_567.89);
    expect(formatted).toContain("1,234,568");
    expect(formatted).not.toContain(".");
  });
});
