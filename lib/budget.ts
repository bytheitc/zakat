/**
 * Splitting a student allowance.
 *
 * The thing that makes this worth writing rather than leaving to a
 * spreadsheet is the order the money is divided in. Most budgeting tools
 * treat giving as whatever is left at the end of the month, which in practice
 * means never. Here sadaqah comes out at the same time as the fixed costs,
 * because an amount set aside first is an amount that actually gets given.
 *
 * Nothing here is a religious instruction. Sadaqah is voluntary and the
 * default share is a starting point to be argued with, not a figure anybody
 * is owed.
 */

export interface Allowance {
  /** What arrives, per month, from every source. */
  readonly monthlyIncome: number;
  /** Costs that are the same whatever you do — hostel, transport, data. */
  readonly fixedCosts: number;
  /** Share of what remains to set aside for giving, 0 to 1. */
  readonly sadaqahShare: number;
  /** Share of what remains to save, 0 to 1. */
  readonly savingsShare: number;
}

export interface BudgetSplit {
  readonly fixedCosts: number;
  readonly sadaqah: number;
  readonly savings: number;
  /** What is genuinely yours to spend — food beyond the basics, everything else. */
  readonly spending: number;
  /** Negative when the fixed costs alone exceed the income. Surfaced rather
   *  than clamped, because a student in that position needs to see it. */
  readonly surplus: number;
  readonly overspent: boolean;
}

export function splitAllowance(allowance: Allowance): BudgetSplit {
  const { monthlyIncome, fixedCosts } = allowance;
  const surplus = monthlyIncome - fixedCosts;

  // Shares apply to what is left after fixed costs, not to gross income.
  // Applying them to gross would ask a student whose rent eats 90% of their
  // allowance to save a tenth of money that does not exist.
  if (surplus <= 0) {
    return {
      fixedCosts,
      sadaqah: 0,
      savings: 0,
      spending: 0,
      surplus,
      overspent: true,
    };
  }

  const sadaqah = surplus * clampShare(allowance.sadaqahShare);
  const savings = surplus * clampShare(allowance.savingsShare);
  const spending = Math.max(0, surplus - sadaqah - savings);

  return { fixedCosts, sadaqah, savings, spending, surplus, overspent: false };
}

function clampShare(share: number): number {
  if (!Number.isFinite(share)) return 0;
  return Math.min(1, Math.max(0, share));
}

/**
 * What is safe to spend per day for the rest of the month.
 *
 * The useful version of this number accounts for what has already gone, not
 * just what was planned — the question a student asks on the 19th is "how
 * much can I spend now", and a figure based on the original plan answers a
 * question nobody is asking.
 */
export function dailyAllowance(
  spendingBudget: number,
  alreadySpent: number,
  daysRemaining: number
): number {
  if (daysRemaining <= 0) return 0;
  return Math.max(0, (spendingBudget - alreadySpent) / daysRemaining);
}

/** Days left in the month containing `date`, counting today. */
export function daysLeftInMonth(date: Date): number {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return lastDay - date.getDate() + 1;
}
