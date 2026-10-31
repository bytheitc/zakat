/**
 * Zakat arithmetic, and nothing more than arithmetic.
 *
 * This is the part of the project that has to be handled carefully. Zakat is
 * an obligation, and a tool that quietly resolves a point scholars disagree
 * on — and then prints a confident number in naira — is doing something worse
 * than being unhelpful. So the rules here are:
 *
 * 1. Every input is the user's. We never fetch a gold price, never guess at
 *    their assets, and never remember anything between sessions.
 * 2. Where authorities differ, the difference is an option with both sides
 *    named — never a default buried in a constant.
 * 3. The result always carries the inputs it came from, so the student can
 *    show the working to somebody who actually knows.
 *
 * The app says plainly that it is a calculator and not a ruling. Please keep
 * that framing in anything you add.
 */

/** Zakat is one fortieth — 2.5% — of zakatable wealth held for a lunar year. */
export const ZAKAT_RATE = 0.025;

/**
 * Some scholars hold that if you reckon your zakat on the solar (Gregorian)
 * calendar instead of the lunar one, the rate should rise to cover the
 * roughly eleven extra days — 2.577% rather than 2.5%. We offer it because
 * students invariably think in Gregorian years, not because we are taking a
 * position on it.
 */
export const ZAKAT_RATE_SOLAR_YEAR = 0.02577;

/** The two nisab thresholds, in grams of the metal. */
export const NISAB_GOLD_GRAMS = 85;
export const NISAB_SILVER_GRAMS = 595;

export type NisabBasis = "gold" | "silver";

export interface Assets {
  /** Cash in hand, in current accounts, in mobile money. */
  readonly cash: number;
  /** Money in savings, including anything put aside for school fees. */
  readonly savings: number;
  /** Market value of gold and silver owned, however it is held. */
  readonly preciousMetals: number;
  /** Money owed to you that you genuinely expect back. Money you have
   *  written off is not an asset and should not be entered here. */
  readonly receivables: number;
  /** Stock held for resale, at what it would sell for today. Relevant to the
   *  surprising number of students running a small business. */
  readonly tradeGoods: number;
}

export interface Liabilities {
  /** Debts due now — not the whole of a long-term loan. */
  readonly immediateDebts: number;
}

export interface ZakatInput {
  readonly assets: Assets;
  readonly liabilities: Liabilities;
  readonly nisabBasis: NisabBasis;
  /** Price per gram, in naira, as the student looked it up today. */
  readonly goldPricePerGram: number;
  readonly silverPricePerGram: number;
  readonly useSolarYearRate?: boolean;
}

export interface ZakatResult {
  readonly totalAssets: number;
  readonly netWealth: number;
  readonly nisabValue: number;
  readonly nisabBasis: NisabBasis;
  readonly meetsNisab: boolean;
  readonly rate: number;
  /** Zero when nisab is not met — not a small number, zero. */
  readonly zakatDue: number;
  /** How far below the threshold, when it is not met. Students find this
   *  more useful than a bare "no": it answers "how close am I?". */
  readonly shortfall: number;
}

export function nisabValue(input: ZakatInput): number {
  return input.nisabBasis === "gold"
    ? NISAB_GOLD_GRAMS * input.goldPricePerGram
    : NISAB_SILVER_GRAMS * input.silverPricePerGram;
}

export function computeZakat(input: ZakatInput): ZakatResult {
  const { assets, liabilities } = input;

  const totalAssets =
    assets.cash +
    assets.savings +
    assets.preciousMetals +
    assets.receivables +
    assets.tradeGoods;

  // Debts due now are deducted; long-term debt is not, which is why the field
  // is named `immediateDebts` rather than `debts`. Getting a student to
  // subtract an entire student loan here would wipe out a zakat they owe.
  const netWealth = totalAssets - liabilities.immediateDebts;

  const nisab = nisabValue(input);
  const meetsNisab = netWealth >= nisab && netWealth > 0;
  const rate = input.useSolarYearRate ? ZAKAT_RATE_SOLAR_YEAR : ZAKAT_RATE;

  return {
    totalAssets,
    netWealth,
    nisabValue: nisab,
    nisabBasis: input.nisabBasis,
    meetsNisab,
    rate,
    zakatDue: meetsNisab ? netWealth * rate : 0,
    shortfall: meetsNisab ? 0 : Math.max(0, nisab - netWealth),
  };
}

/**
 * Zakat al-Fitr, paid per person before the Eid prayer. It is measured in
 * food — one sa', about 2.5kg of the local staple — not in money, so the
 * calculation takes a price per kilo and shows both figures. Which staple,
 * and whether money may be given instead of food, are matters the student
 * should settle with their own scholar; the app shows the measure and lets
 * them price it.
 */
export const SAA_KILOGRAMS = 2.5;

export function zakatAlFitr(
  householdSize: number,
  pricePerKilo: number
): { kilograms: number; cost: number } {
  const people = Math.max(0, Math.floor(householdSize));
  const kilograms = people * SAA_KILOGRAMS;
  return { kilograms, cost: kilograms * pricePerKilo };
}

/** Naira, no decimals — nobody pays zakat in kobo and the extra digits make
 *  the figure harder to read aloud. */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}
