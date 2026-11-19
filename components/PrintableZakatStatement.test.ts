import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PrintableZakatStatement } from "./PrintableZakatStatement";

const result = {
  totalAssets: 2_000_000,
  netWealth: 1_950_000,
  nisabValue: 1_071_000,
  nisabBasis: "silver" as const,
  meetsNisab: true,
  rate: 0.025,
  zakatDue: 48_750,
  shortfall: 0,
};

const fmt = (amount: number) => `N${amount.toLocaleString("en-NG")}`;

describe("printable zakat statement", () => {
  it("renders the calculation summary and account breakdown", () => {
    const html = renderToStaticMarkup(createElement(PrintableZakatStatement, {
      priced: true,
      basis: "silver",
      metalPrice: 1_800,
      solarYear: false,
      currency: "NGN",
      result,
      totals: {
        assets: { cash: 500_000, savings: 1_500_000, preciousMetals: 0, receivables: 0, tradeGoods: 0 },
        immediateDebts: 50_000,
        lines: [{
          sourceId: "gtbank",
          sourceLabel: "GTBank ...6789",
          category: "savings",
          original: { amount: 1_500_000, currency: "NGN" },
          home: 1_500_000,
          rate: 1,
          confidence: "stated",
        }],
        debtLines: [{
          sourceId: "debt",
          sourceLabel: "Typed debt",
          original: { amount: 50_000, currency: "NGN" },
          home: 50_000,
        }],
        perCategory: { cash: 500_000, savings: 1_500_000, preciousMetals: 0, receivables: 0, tradeGoods: 0 },
        missingRates: [],
        unconverted: [],
        complete: true,
        includedSources: 2,
        excludedSources: 0,
        warnings: [],
      },
      fmt,
    }));

    expect(html).toContain("Zakat calculation statement");
    expect(html).toContain("silver nisab");
    expect(html).toContain("Lunar year: 2.5%");
    expect(html).toContain("GTBank ...6789");
    expect(html).toContain("Zakat is due");
  });

  it("shows missing conversions and never presents a final result", () => {
    const html = renderToStaticMarkup(createElement(PrintableZakatStatement, {
      priced: true,
      basis: "silver",
      metalPrice: 1_800,
      solarYear: true,
      currency: "NGN",
      result: { ...result, meetsNisab: false, zakatDue: 0, shortfall: 50_000 },
      totals: {
        assets: { cash: 500_000, savings: 0, preciousMetals: 0, receivables: 0, tradeGoods: 0 },
        immediateDebts: 0,
        lines: [{
          sourceId: "dom",
          sourceLabel: "Access ...4321",
          category: "cash",
          original: { amount: 500, currency: "USD" },
          home: null,
          rate: null,
          confidence: "stated",
        }],
        debtLines: [],
        perCategory: { cash: 0, savings: 0, preciousMetals: 0, receivables: 0, tradeGoods: 0 },
        missingRates: ["USD"],
        unconverted: [{
          sourceId: "dom",
          sourceLabel: "Access ...4321",
          category: "cash",
          original: { amount: 500, currency: "USD" },
          home: null,
          rate: null,
          confidence: "stated",
        }],
        complete: false,
        includedSources: 1,
        excludedSources: 0,
        warnings: ["Nothing in USD is in the total yet, because there is no rate for it."],
      },
      fmt,
    }));

    expect(html).toContain("Incomplete calculation");
    expect(html).toContain("no conversion rate entered");
    expect(html).toContain("Gregorian / solar year: 2.577%");
  });
});
