/**
 * One shared shape for everything a student can point the calculator at.
 *
 * A bank statement, a second bank statement, an exchange CSV, a wallet
 * address and a figure typed by hand all end up here, as a `FinancialSource`
 * holding one or more balances. Everything downstream — the totals, the
 * working shown under the result, the duplicate check — operates on this and
 * nothing else, so adding a new kind of import means writing one adapter and
 * changing nothing else.
 *
 * Two decisions in this file are worth defending:
 *
 * `confidence` exists because a closing balance printed on a statement and a
 * balance we worked out by adding up transactions are not the same claim, and
 * the student deserves to see which one they are looking at before they pay
 * on it.
 *
 * `included` exists because an imported source is a suggestion, not a fact
 * about what is zakatable. A joint account, a float a student holds for a
 * society, money that belongs to a sibling — all of these land in a statement
 * and none of them are the student's wealth. Import brings it in; the student
 * decides whether it counts.
 */

import type { Money } from "@/lib/money";

/** The asset buckets `computeZakat` already understands. */
export type AssetCategory =
  | "cash"
  | "savings"
  | "preciousMetals"
  | "regularJewellery"
  | "receivables"
  | "tradeGoods";

export const ASSET_CATEGORIES: readonly AssetCategory[] = [
  "cash",
  "savings",
  "preciousMetals",
  "regularJewellery",
  "receivables",
  "tradeGoods",
];

export const CATEGORY_LABELS: Readonly<Record<AssetCategory, string>> = {
  cash: "Cash",
  savings: "Savings",
  preciousMetals: "Gold and silver",
  regularJewellery: "Regularly worn jewellery",
  receivables: "Money owed to you",
  tradeGoods: "Stock for resale",
};

export type SourceKind = "statement" | "wallet" | "bank" | "manual";

/**
 * How sure we are of a figure.
 *
 * - `stated`: the number was printed on the statement or returned by the
 *   account itself. We read it; we did not compute it.
 * - `derived`: we added up the transactions to get here. Correct only if the
 *   file is the whole period and the opening balance was known.
 * - `estimated`: a running balance read off the last row, a wallet balance at
 *   a price the student typed, or anything else with a judgement in it.
 */
export type Confidence = "stated" | "derived" | "estimated";

export const CONFIDENCE_NOTES: Readonly<Record<Confidence, string>> = {
  stated: "Read directly from the statement",
  derived: "Worked out by adding up the transactions",
  estimated: "Worked out, with an assumption in it",
};

export interface SourceBalance {
  readonly category: AssetCategory;
  readonly money: Money;
  readonly confidence: Confidence;
  /** ISO date the figure was true on, when the source says. */
  readonly asOf?: string;
  readonly note?: string;
}

export type Origin = "file" | "paste" | "wallet" | "connector" | "typed";

export interface Provenance {
  readonly origin: Origin;
  readonly fileName?: string;
  /** Content hash, used only to notice the same file imported twice. */
  readonly contentHash?: string;
  readonly format?: string;
  readonly rowCount?: number;
  readonly periodStart?: string;
  readonly periodEnd?: string;
  readonly chain?: string;
  readonly address?: string;
  readonly importedAt: string;
}

export interface FinancialSource {
  readonly id: string;
  readonly kind: SourceKind;
  /** What the student sees in the list: "GTBank savings 1234". */
  readonly label: string;
  readonly institution?: string;
  /** Masked. We never keep a full account number; there is no reason to. */
  readonly accountRef?: string;
  readonly balances: readonly SourceBalance[];
  /**
   * An overdrawn account is a debt due now, not a negative asset. Keeping it
   * separate stops a minus figure from quietly cancelling out savings held
   * elsewhere, which would understate the zakat owed.
   */
  readonly debtDueNow?: Money;
  readonly included: boolean;
  readonly provenance: Provenance;
  /** Things the student needs to read before trusting the figure. */
  readonly warnings: readonly string[];
}

/** A transaction row, kept so a balance can be re-derived and shown. */
export interface Transaction {
  /** ISO date, or undefined when the row's date could not be read. */
  readonly date?: string;
  readonly description: string;
  /** Positive is money in, negative is money out. */
  readonly amount: number;
  readonly currency: string;
  /** Running balance after this row, when the statement carries one. */
  readonly balance?: number;
}

export interface ParsedStatement {
  readonly institution?: string;
  readonly accountRef?: string;
  readonly accountType?: "current" | "savings" | "other";
  readonly currency: string;
  readonly transactions: readonly Transaction[];
  /** The closing balance as printed, when the file states one outright. */
  readonly statedBalance?: number;
  readonly statedBalanceAsOf?: string;
  readonly format: string;
  readonly warnings: readonly string[];
}

/** A quantity of a token held at an address or on an exchange. */
export interface Holding {
  readonly symbol: string;
  readonly quantity: number;
  readonly note?: string;
}

export function sourceTotalIn(
  source: FinancialSource,
  category: AssetCategory
): readonly Money[] {
  return source.balances.filter((b) => b.category === category).map((b) => b.money);
}

/**
 * A short stable id. Not cryptographic and not trying to be — it exists so
 * React has a key and so the same file imported twice can be spotted.
 */
export function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

let counter = 0;
export function newSourceId(seed: string): string {
  counter += 1;
  return `${fnv1a(seed)}-${counter.toString(36)}`;
}

/** Last four characters only, which is all anyone needs to tell two apart. */
export function maskAccount(ref: string): string {
  const clean = ref.replace(/\s/g, "");
  if (clean.length <= 4) return clean;
  return `...${clean.slice(-4)}`;
}
