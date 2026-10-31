"use client";

import { useMemo, useState } from "react";
import {
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
  SAA_KILOGRAMS,
  type NisabBasis,
  computeZakat,
  formatNaira,
  zakatAlFitr,
} from "@/lib/zakat";
import { dailyAllowance, daysLeftInMonth, splitAllowance } from "@/lib/budget";
import { Field } from "@/components/Field";

/** Fields start blank rather than at zero: a pre-filled 0 reads as an answer,
 *  and we would rather the student tell us than have us assume. */
const num = (value: string) => {
  const parsed = Number(value.replace(/[,\s₦]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

type Tab = "zakat" | "fitr" | "budget";

export default function Home() {
  const [tab, setTab] = useState<Tab>("zakat");

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Zakat Kit</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)] dark:text-white/60">
          Work out whether you owe zakat, and what to set aside each month.
        </p>
      </header>

      <p className="mb-6 rounded-lg border border-[var(--color-brand)]/25 bg-[var(--color-brand-soft)] p-3 text-sm dark:bg-white/5">
        <strong>This is a calculator, not a ruling.</strong> It does arithmetic on
        numbers you enter and shows its working. Where scholars differ it offers the
        options rather than choosing for you — and on anything that matters, ask
        someone qualified rather than a web page.
      </p>

      <nav className="mb-6 flex gap-1 border-b border-[var(--color-rule)]">
        {(
          [
            ["zakat", "Zakat on wealth"],
            ["fitr", "Zakat al-Fitr"],
            ["budget", "Monthly plan"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              tab === id
                ? "border-[var(--color-brand)] font-medium"
                : "border-transparent text-[var(--color-ink-soft)]"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "zakat" && <ZakatPanel />}
      {tab === "fitr" && <FitrPanel />}
      {tab === "budget" && <BudgetPanel />}
    </main>
  );
}

function ZakatPanel() {
  const [cash, setCash] = useState("");
  const [savings, setSavings] = useState("");
  const [metals, setMetals] = useState("");
  const [receivables, setReceivables] = useState("");
  const [tradeGoods, setTradeGoods] = useState("");
  const [debts, setDebts] = useState("");
  const [basis, setBasis] = useState<NisabBasis>("silver");
  const [goldPrice, setGoldPrice] = useState("");
  const [silverPrice, setSilverPrice] = useState("");
  const [solarYear, setSolarYear] = useState(false);

  // Without a metal price there is no threshold, so there is no answer to
  // give. Showing "₦0 due" in that state would be a wrong answer dressed as a
  // right one — the student simply has not finished entering their data.
  const priced = basis === "gold" ? num(goldPrice) > 0 : num(silverPrice) > 0;

  const result = useMemo(
    () =>
      computeZakat({
        assets: {
          cash: num(cash),
          savings: num(savings),
          preciousMetals: num(metals),
          receivables: num(receivables),
          tradeGoods: num(tradeGoods),
        },
        liabilities: { immediateDebts: num(debts) },
        nisabBasis: basis,
        goldPricePerGram: num(goldPrice),
        silverPricePerGram: num(silverPrice),
        useSolarYearRate: solarYear,
      }),
    [
      cash,
      savings,
      metals,
      receivables,
      tradeGoods,
      debts,
      basis,
      goldPrice,
      silverPrice,
      solarYear,
    ]
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">What you hold</h2>
        <Field
          label="Cash"
          hint="In hand, current account, mobile money"
          prefix="₦"
          value={cash}
          onChange={setCash}
        />
        <Field
          label="Savings"
          hint="Including anything put aside for fees"
          prefix="₦"
          value={savings}
          onChange={setSavings}
        />
        <Field
          label="Gold and silver"
          hint="What it would sell for today"
          prefix="₦"
          value={metals}
          onChange={setMetals}
        />
        <Field
          label="Money owed to you"
          hint="Only what you genuinely expect back"
          prefix="₦"
          value={receivables}
          onChange={setReceivables}
        />
        <Field
          label="Stock for resale"
          hint="If you run a small business"
          prefix="₦"
          value={tradeGoods}
          onChange={setTradeGoods}
        />
        <Field
          label="Debts due now"
          hint="Not the whole of a long-term loan — only what is due"
          prefix="₦"
          value={debts}
          onChange={setDebts}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">The threshold</h2>
        <p className="text-xs text-[var(--color-ink-soft)]">
          Nisab is {NISAB_GOLD_GRAMS}g of gold or {NISAB_SILVER_GRAMS}g of silver.
          Which to use is a question for your scholar — silver usually gives the lower
          threshold, so more people owe. Look up today&rsquo;s price and enter it.
        </p>
        <div className="flex gap-2">
          {(["silver", "gold"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setBasis(option)}
              className={`rounded border px-3 py-1.5 text-sm capitalize ${
                basis === option
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] font-medium dark:bg-white/10"
                  : "border-[var(--color-rule)]"
              }`}
            >
              {option} nisab
            </button>
          ))}
        </div>
        {basis === "gold" ? (
          <Field
            label="Gold price"
            prefix="₦"
            suffix="per gram"
            value={goldPrice}
            onChange={setGoldPrice}
          />
        ) : (
          <Field
            label="Silver price"
            prefix="₦"
            suffix="per gram"
            value={silverPrice}
            onChange={setSilverPrice}
          />
        )}
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={solarYear}
            onChange={(e) => setSolarYear(e.target.checked)}
            className="mt-1"
          />
          <span>
            I reckon my zakat year on the Gregorian calendar
            <span className="block text-xs text-[var(--color-ink-soft)]">
              Some scholars raise the rate to 2.577% to cover the extra eleven days.
            </span>
          </span>
        </label>
      </section>

      <section
        className={`rounded-xl border p-4 ${
          !priced
            ? "border-[var(--color-rule)]"
            : result.meetsNisab
              ? "border-[var(--color-due)]/40 bg-[var(--color-brand-soft)] dark:bg-white/5"
              : "border-[var(--color-short)]/40"
        }`}
      >
        <h2 className="text-sm font-semibold">Result</h2>

        {!priced ? (
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            Enter today&rsquo;s {basis} price to see the threshold.
          </p>
        ) : (
          <>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {formatNaira(result.zakatDue)}
            </p>
            <p className="mt-1 text-sm">
              {result.meetsNisab
                ? `due at ${(result.rate * 100).toFixed(
                    result.rate === 0.025 ? 1 : 3
                  )}% of your net zakatable wealth`
                : `You are ${formatNaira(
                    result.shortfall
                  )} below the ${basis} threshold, so no zakat is due on this wealth.`}
            </p>

            <dl className="mt-4 space-y-1 border-t border-[var(--color-rule)] pt-3 text-sm">
              {[
                ["Total assets", formatNaira(result.totalAssets)],
                ["Less debts due now", `− ${formatNaira(num(debts))}`],
                ["Net zakatable wealth", formatNaira(result.netWealth)],
                [`Nisab (${basis})`, formatNaira(result.nisabValue)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-[var(--color-ink-soft)]">{label}</dt>
                  <dd className="tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-3 text-xs text-[var(--color-ink-soft)]">
              Zakat is due on wealth held for a full lunar year. This works out the
              amount; whether the year has passed is for you to know.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

function FitrPanel() {
  const [people, setPeople] = useState("1");
  const [pricePerKilo, setPricePerKilo] = useState("");

  const result = zakatAlFitr(num(people), num(pricePerKilo));

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--color-ink-soft)]">
        Zakat al-Fitr is paid per person before the Eid prayer, measured in food — one
        sa&rsquo;, about {SAA_KILOGRAMS}kg of the local staple. Whether it may be given
        as money instead of food is a question for your scholar; this shows you the
        measure and what it would cost.
      </p>

      <Field label="People in your household" value={people} onChange={setPeople} />
      <Field
        label="Price of your staple"
        hint="Rice, maize — whatever you would actually give"
        prefix="₦"
        suffix="per kg"
        value={pricePerKilo}
        onChange={setPricePerKilo}
      />

      <section className="rounded-xl border border-[var(--color-rule)] p-4">
        <p className="text-2xl font-semibold tabular-nums">
          {result.kilograms.toFixed(1)} kg
        </p>
        {num(pricePerKilo) > 0 && (
          <p className="mt-1 text-sm">
            about {formatNaira(result.cost)} at the price you entered
          </p>
        )}
      </section>
    </div>
  );
}

function BudgetPanel() {
  const [income, setIncome] = useState("");
  const [fixed, setFixed] = useState("");
  const [sadaqahPercent, setSadaqahPercent] = useState("5");
  const [savingsPercent, setSavingsPercent] = useState("20");
  const [spent, setSpent] = useState("");

  const split = splitAllowance({
    monthlyIncome: num(income),
    fixedCosts: num(fixed),
    sadaqahShare: num(sadaqahPercent) / 100,
    savingsShare: num(savingsPercent) / 100,
  });

  const daysLeft = daysLeftInMonth(new Date());
  const perDay = dailyAllowance(split.spending, num(spent), daysLeft);

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--color-ink-soft)]">
        Sadaqah and savings come out at the same time as your fixed costs, not from
        whatever survives the month — which, in practice, is nothing. The shares are a
        starting point, not a requirement.
      </p>

      <Field
        label="Monthly allowance"
        hint="Everything that comes in"
        prefix="₦"
        value={income}
        onChange={setIncome}
      />
      <Field
        label="Fixed costs"
        hint="Hostel, transport, data — the unavoidable ones"
        prefix="₦"
        value={fixed}
        onChange={setFixed}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Sadaqah"
          suffix="% of what's left"
          value={sadaqahPercent}
          onChange={setSadaqahPercent}
        />
        <Field
          label="Savings"
          suffix="% of what's left"
          value={savingsPercent}
          onChange={setSavingsPercent}
        />
      </div>

      {num(income) > 0 && (
        <section
          className={`rounded-xl border p-4 ${
            split.overspent
              ? "border-[var(--color-over)]/40"
              : "border-[var(--color-rule)]"
          }`}
        >
          {split.overspent ? (
            <>
              <p className="text-sm font-semibold text-[var(--color-over)]">
                Your fixed costs are {formatNaira(-split.surplus)} more than your
                allowance.
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                There is nothing to split. This is worth sorting out before planning
                anything else — the MSSN welfare desk exists for exactly this.
              </p>
            </>
          ) : (
            <>
              <dl className="space-y-1 text-sm">
                {(
                  [
                    ["Fixed costs", split.fixedCosts],
                    ["Sadaqah", split.sadaqah],
                    ["Savings", split.savings],
                    ["Yours to spend", split.spending],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-[var(--color-ink-soft)]">{label}</dt>
                    <dd className="tabular-nums">{formatNaira(value)}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 border-t border-[var(--color-rule)] pt-3">
                <Field
                  label="Spent so far this month"
                  prefix="₦"
                  value={spent}
                  onChange={setSpent}
                />
                <p className="mt-2 text-sm">
                  <span className="text-lg font-semibold tabular-nums">
                    {formatNaira(perDay)}
                  </span>{" "}
                  <span className="text-[var(--color-ink-soft)]">
                    a day for the {daysLeft} day{daysLeft === 1 ? "" : "s"} left in the
                    month
                  </span>
                </p>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
