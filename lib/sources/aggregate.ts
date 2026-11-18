/**
 * Adding up every source into the five figures `computeZakat` wants.
 *
 * The arithmetic is trivial. What this file is actually for is the four ways
 * a multi-source total can be quietly wrong, each of which produces a
 * plausible number that nobody would think to question:
 *
 * 1. **A currency with no rate.** Dropping it understates the total, and
 *    treating it as naira wrecks it. Neither happens: the line comes back
 *    unconverted, `complete` goes false, and the caller must say so.
 * 2. **The same statement imported twice.** Two downloads of the same month,
 *    named differently by the browser, double an account. See
 *    `lib/sources/duplicates.ts`.
 * 3. **An overdraft cancelling out savings.** A minus balance held as an
 *    asset silently reduces zakat owed, so overdrafts arrive as debts and are
 *    never netted off here.
 * 4. **A number nobody meant to include.** Every line keeps the source it
 *    came from, so the working can be shown account by account rather than as
 *    one total the student has to take on trust.
 *
 * Zakat that comes out too low is the failure that matters. Everything here
 * is arranged to make that loud rather than invisible.
 */

import { BASE_CURRENCY, convert, type Money, type RateTable } from "@/lib/money";
import type { Assets } from "@/lib/zakat";
import type {
  AssetCategory,
  Confidence,
  FinancialSource,
  SourceBalance,
} from "@/lib/sources/types";
import { ASSET_CATEGORIES } from "@/lib/sources/types";

export interface AggregatedLine {
  readonly sourceId: string;
  readonly sourceLabel: string;
  readonly category: AssetCategory;
  /** What the source said, in the currency it said it in. */
  readonly original: Money;
  /** In the home currency, or null when no rate was available for that currency. */
  readonly home: number | null;
  readonly rate: number | null;
  readonly confidence: Confidence;
  readonly asOf?: string;
  readonly note?: string;
}

export interface DebtLine {
  readonly sourceId: string;
  readonly sourceLabel: string;
  readonly original: Money;
  readonly home: number | null;
}

export interface Aggregation {
  /** Ready to hand straight to `computeZakat`. */
  readonly assets: Assets;
  readonly immediateDebts: number;
  readonly lines: readonly AggregatedLine[];
  readonly debtLines: readonly DebtLine[];
  readonly perCategory: Readonly<Record<AssetCategory, number>>;
  /** Currencies seen that no rate covers, each once, sorted. */
  readonly missingRates: readonly string[];
  /** Lines left out of the total because of a missing rate. */
  readonly unconverted: readonly AggregatedLine[];
  /**
   * False when anything was left out. The interface must not show a zakat
   * figure as final while this is false.
   */
  readonly complete: boolean;
  readonly includedSources: number;
  readonly excludedSources: number;
  readonly warnings: readonly string[];
}

const EMPTY_ASSETS: Record<AssetCategory, number> = {
  cash: 0,
  savings: 0,
  preciousMetals: 0,
  regularJewellery: 0,
  receivables: 0,
  tradeGoods: 0,
};

export function aggregate(
  sources: readonly FinancialSource[],
  rates: RateTable,
  base: string = BASE_CURRENCY
): Aggregation {
  const lines: AggregatedLine[] = [];
  const debtLines: DebtLine[] = [];
  const missing = new Set<string>();
  const warnings: string[] = [];

  const included = sources.filter((s) => s.included);
  const perCategory: Record<AssetCategory, number> = { ...EMPTY_ASSETS };
  let immediateDebts = 0;

  for (const source of included) {
    for (const balance of source.balances) {
      const line = toLine(source, balance, rates, base);
      lines.push(line);
      if (line.home === null) {
        missing.add(line.original.currency);
      } else {
        perCategory[line.category] += line.home;
      }
    }

    if (source.debtDueNow && source.debtDueNow.amount !== 0) {
      const converted = convert(source.debtDueNow, rates, base);
      debtLines.push({
        sourceId: source.id,
        sourceLabel: source.label,
        original: source.debtDueNow,
        home: converted.amount,
      });
      if (converted.amount === null) missing.add(source.debtDueNow.currency);
      else immediateDebts += converted.amount;
    }
  }

  const unconverted = lines.filter((line) => line.home === null);

  if (unconverted.length > 0) {
    const currencies = [...missing].sort().join(", ");
    warnings.push(
      `Nothing in ${currencies} is in the total yet, because there is no rate for it. The figure below is too low until you enter one.`
    );
  }

  // A debt that cannot be converted is left out of the deduction, which
  // overstates the zakat rather than understating it. Still worth saying:
  // the student is being asked for more than they owe.
  if (debtLines.some((d) => d.home === null)) {
    warnings.push(
      "A debt is in a currency with no rate, so it has not been deducted. The amount shown is higher than it should be."
    );
  }

  return {
    assets: {
      cash: perCategory.cash,
      savings: perCategory.savings,
      preciousMetals: perCategory.preciousMetals,
      regularJewellery: perCategory.regularJewellery,
      receivables: perCategory.receivables,
      tradeGoods: perCategory.tradeGoods,
    },
    immediateDebts,
    lines,
    debtLines,
    perCategory,
    missingRates: [...missing].sort(),
    unconverted,
    complete: unconverted.length === 0 && debtLines.every((d) => d.home !== null),
    includedSources: included.length,
    excludedSources: sources.length - included.length,
    warnings,
  };
}

function toLine(
  source: FinancialSource,
  balance: SourceBalance,
  rates: RateTable,
  base: string
): AggregatedLine {
  const converted = convert(balance.money, rates, base);
  return {
    sourceId: source.id,
    sourceLabel: source.label,
    category: balance.category,
    original: balance.money,
    home: converted.amount,
    rate: converted.rate,
    confidence: balance.confidence,
    asOf: balance.asOf,
    note: balance.note,
  };
}

/** Every currency and ticker across the sources that is not already the home currency. */
export function currenciesNeeded(
  sources: readonly FinancialSource[],
  base: string = BASE_CURRENCY
): readonly string[] {
  const seen = new Set<string>();
  for (const source of sources) {
    if (!source.included) continue;
    for (const balance of source.balances) {
      if (balance.money.currency !== base && balance.money.amount !== 0) {
        seen.add(balance.money.currency);
      }
    }
    if (source.debtDueNow && source.debtDueNow.currency !== BASE_CURRENCY) {
      seen.add(source.debtDueNow.currency);
    }
  }
  return [...seen].sort();
}

/**
 * The least confident thing in the total.
 *
 * A result is only as trustworthy as its weakest line, so the summary shows
 * that one rather than an average — an average would let nine bank-stated
 * balances hide one figure somebody guessed at.
 */
export function weakestConfidence(lines: readonly AggregatedLine[]): Confidence | null {
  if (lines.length === 0) return null;
  const order: readonly Confidence[] = ["estimated", "derived", "stated"];
  for (const level of order) {
    if (lines.some((line) => line.confidence === level)) return level;
  }
  return null;
}

/** Totals per category, for the per-account working shown under the result. */
export function groupByCategory(
  lines: readonly AggregatedLine[]
): ReadonlyArray<{ category: AssetCategory; lines: readonly AggregatedLine[]; total: number }> {
  return ASSET_CATEGORIES.map((category) => {
    const matching = lines.filter((line) => line.category === category);
    return {
      category,
      lines: matching,
      total: matching.reduce((sum, line) => sum + (line.home ?? 0), 0),
    };
  }).filter((group) => group.lines.length > 0);
}
