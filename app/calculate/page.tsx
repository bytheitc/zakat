"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  Check,
  CheckCircle2,
  CircleHelp,
  Coins,
  LockKeyhole,
  Printer,
  RotateCcw,
  Save,
  Scale,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import {
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
  SAA_KILOGRAMS,
  type NisabBasis,
  computeZakat,
  formatIn,
  zakatAlFitr,
} from "@/lib/zakat";
import { dailyAllowance, daysLeftInMonth, splitAllowance } from "@/lib/budget";
import { usePersistentState, clearSaved } from "@/lib/persist";
import { useRecords } from "@/lib/records";
import { useAccount } from "@/lib/account";
import { CURRENCIES, useHomeCurrency } from "@/lib/currency";
import { Field } from "@/components/Field";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Meter } from "@/components/Meter";
import { dur, ease } from "@/lib/motion-tokens";
import { formatMoney } from "@/lib/money";
import { aggregate, currenciesNeeded, groupByCategory, weakestConfidence } from "@/lib/sources/aggregate";
import { findDuplicates } from "@/lib/sources/duplicates";
import { manualDebt, manualSource } from "@/lib/sources/manual";
import { CATEGORY_LABELS, CONFIDENCE_NOTES, type AssetCategory, type FinancialSource } from "@/lib/sources/types";
import { ImportDropzone } from "@/components/sources/ImportDropzone";
import { RatesPanel } from "@/components/sources/RatesPanel";
import { SourceCard } from "@/components/sources/SourceCard";
import { WalletForm } from "@/components/sources/WalletForm";
import { CategoryIcon } from "@/components/sources/CategoryIcon";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { AppHeader } from "@/components/app/AppHeader";
import { HelpCenter, type HelpTopic } from "@/components/app/HelpCenter";
import { Onboarding, hasOnboarded } from "@/components/app/Onboarding";
import { PrintableZakatStatement } from "@/components/PrintableZakatStatement";

/** Fields start blank rather than at zero: a pre-filled 0 reads as an answer. */
const num = (value: string) => {
  const parsed = Number(value.replace(/[^\d.\-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

type Tab = "zakat" | "fitr" | "budget";
const TABS: readonly { id: Tab; label: string; hint: string }[] = [
  { id: "zakat", label: "Zakat on wealth", hint: "What you owe on what you hold" },
  { id: "fitr", label: "Zakat al-Fitr", hint: "Per person, before Eid" },
  { id: "budget", label: "Monthly plan", hint: "Set sadaqah aside first" },
];

export default function Calculator() {
  const [tab, setTab] = useState<Tab>("zakat");
  const home = useHomeCurrency();
  const [helpOpen, setHelpOpen] = useState(false);
  const [topic, setTopic] = useState<HelpTopic>("start");
  const [tour, setTour] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "fitr" || t === "budget") setTab(t);
    if (!hasOnboarded()) setTour(true);
  }, []);

  const help = (t: HelpTopic) => {
    setTopic(t);
    setHelpOpen(true);
  };

  return (
    <div className="min-h-dvh bg-[var(--color-wash)]">
      <AppHeader onHelp={() => help("start")} />

      <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-8 sm:px-6 lg:pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Zakat calculator</h1>
            <p className="mt-1.5 max-w-xl text-[15px] text-[var(--color-ink-soft)]">
              A calculator, not a ruling: it does the arithmetic and shows its working. Where scholars differ, you choose.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="home-currency" className="text-sm font-bold">Your currency</label>
            <select
              id="home-currency"
              value={home.currency}
              onChange={(e) => home.setCurrency(e.target.value)}
              className="h-10 rounded-md border-2 border-[var(--color-ink)] bg-[var(--color-card)] px-2 text-sm font-bold"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} · {c.name}</option>
              ))}
            </select>
            <p className="flex items-center gap-1.5 rounded-full border border-[var(--color-rule)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)]">
              <LockKeyhole className="size-3.5 text-[var(--color-brand)]" /> Nothing you enter leaves this device
            </p>
          </div>
        </div>

        <div role="tablist" aria-label="Calculators" className="mt-6 grid gap-2 sm:grid-cols-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id);
                window.history.replaceState(null, "", t.id === "zakat" ? "/calculate" : `/calculate?tab=${t.id}`);
              }}
              className={`rounded-md border-2 px-4 py-3 text-left transition-all ${
                tab === t.id
                  ? "border-[var(--color-ink)] bg-[var(--color-yellow)] shadow-[4px_4px_0_var(--color-ink)]"
                  : "border-[var(--color-rule)] bg-[var(--color-card)] hover:border-[var(--color-ink)]"
              }`}
            >
              <span className="block text-sm font-extrabold">{t.label}</span>
              <span className="block text-xs text-[var(--color-ink-soft)]">{t.hint}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "zakat" && <WealthCalculator help={help} currency={home.currency} symbol={home.symbol} />}
          {tab === "fitr" && <FitrCalculator help={help} currency={home.currency} symbol={home.symbol} />}
          {tab === "budget" && <BudgetPlanner currency={home.currency} symbol={home.symbol} />}
        </div>
        <InstallPrompt />
      </main>

      <HelpCenter open={helpOpen} onClose={() => setHelpOpen(false)} topic={topic} onTopic={setTopic} onReplayTour={() => { setHelpOpen(false); setTour(true); }} />
      <Onboarding open={tour} onClose={() => setTour(false)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Zakat on wealth                                                     */
/* ------------------------------------------------------------------ */

function WealthCalculator({ help, currency, symbol }: { help: (t: HelpTopic) => void; currency: string; symbol: string }) {
  const fmt = (n: number) => formatIn(n, currency);
  const [sources, setSources] = usePersistentState<readonly FinancialSource[]>("wealth:sources", []);
  const [rateInputs, setRateInputs] = usePersistentState<Record<string, string>>("wealth:rates", {});
  const [showWallet, setShowWallet] = useState(false);

  const [cash, setCash] = usePersistentState("wealth:cash", "");
  const [savings, setSavings] = usePersistentState("wealth:savings", "");
  const [metals, setMetals] = usePersistentState("wealth:metals", "");
  const [receivables, setReceivables] = usePersistentState("wealth:receivables", "");
  const [tradeGoods, setTradeGoods] = usePersistentState("wealth:tradeGoods", "");
  const [debts, setDebts] = usePersistentState("wealth:debts", "");

  const [basis, setBasis] = usePersistentState<NisabBasis>("wealth:basis", "silver");
  const [goldPrice, setGoldPrice] = usePersistentState("wealth:goldPrice", "");
  const [silverPrice, setSilverPrice] = usePersistentState("wealth:silverPrice", "");
  const [solarYear, setSolarYear] = usePersistentState("wealth:solarYear", false);

  // Typed figures become sources like everything else, so the totals, the
  // working and the warnings have exactly one code path.
  const typed = useMemo(() => {
    const entries: [AssetCategory, string][] = [["cash", cash], ["savings", savings], ["preciousMetals", metals], ["receivables", receivables], ["tradeGoods", tradeGoods]];
    const built = entries.filter(([, v]) => num(v) !== 0).map(([c, v]) => manualSource(c, num(v), currency));
    return num(debts) !== 0 ? [...built, manualDebt(num(debts), currency)] : built;
  }, [cash, savings, metals, receivables, tradeGoods, debts, currency]);

  const allSources = useMemo(() => [...sources, ...typed], [sources, typed]);
  const rates = useMemo(() => {
    const parsed: Record<string, number> = {};
    for (const [c, v] of Object.entries(rateInputs)) if (num(v) > 0) parsed[c] = num(v);
    return parsed;
  }, [rateInputs]);
  const totals = useMemo(() => aggregate(allSources, rates, currency), [allSources, rates, currency]);
  const currencies = useMemo(() => currenciesNeeded(allSources, currency), [allSources, currency]);
  const duplicates = useMemo(() => findDuplicates(allSources), [allSources]);
  const duplicateMessages = useMemo(() => new Map(duplicates.map((w) => [w.b, w.message])), [duplicates]);

  const priced = basis === "gold" ? num(goldPrice) > 0 : num(silverPrice) > 0;
  const result = useMemo(
    () => computeZakat({ assets: totals.assets, liabilities: { immediateDebts: totals.immediateDebts }, nisabBasis: basis, goldPricePerGram: num(goldPrice), silverPricePerGram: num(silverPrice), useSolarYearRate: solarYear }),
    [totals, basis, goldPrice, silverPrice, solarYear]
  );

  const imported = sources.length;
  const hasHoldings = allSources.length > 0;

  return (
    <>
    <div className="print-hide grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <div className="space-y-5">
        <Step n={1} title="Your bank accounts" status={imported > 0 ? "done" : "optional"} subtitle="Import statements to fill this in for you. Each account keeps its own line." onHelp={() => help("imports")}>
          <ImportDropzone currency={currency} onImport={(added) => setSources((cur) => [...cur, ...added])} />
          {imported > 0 && (
            <ul className="mt-4 space-y-2">
              <AnimatePresence initial={false}>
                {sources.map((source) => (
                  <motion.li key={source.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: dur.base, ease: ease.house }} className="overflow-hidden">
                    <SourceCard
                      source={source}
                      duplicateMessage={duplicateMessages.get(source.id)}
                      onChange={(next) => setSources((cur) => cur.map((s) => (s.id === next.id ? next : s)))}
                      onRemove={() => setSources((cur) => cur.filter((s) => s.id !== source.id))}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
          <button type="button" onClick={() => setShowWallet((o) => !o)} aria-expanded={showWallet} className="mt-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-brand)] hover:underline">
            <Wallet className="size-4" /> {showWallet ? "Hide crypto" : "Add crypto or connect a wallet"}
          </button>
          <AnimatePresence initial={false}>
            {showWallet && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: dur.base, ease: ease.house }} className="overflow-hidden">
                <div className="mt-3"><WalletForm onAdd={(added) => setSources((cur) => [...cur, ...added])} /></div>
              </motion.div>
            )}
          </AnimatePresence>
        </Step>

        <Step
          n={2}
          title={imported > 0 ? "Anything not in those accounts" : "What you hold"}
          status={typed.length > 0 ? "done" : "todo"}
          subtitle={imported > 0 ? "Cash at home, money owed to you, anything the statements don't cover. Don't repeat a balance listed above." : "Type what you have in each. Leave anything that doesn't apply empty."}
          onHelp={() => help("debts")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cash and current accounts" hint="In hand, in the bank, mobile money" prefix={symbol} value={cash} onChange={setCash} />
            <Field label="Savings" hint="Including money set aside for fees" prefix={symbol} value={savings} onChange={setSavings} />
            <Field label="Gold and silver" hint="What it would sell for today" prefix={symbol} value={metals} onChange={setMetals} />
            <Field label="Money owed to you" hint="Only what you expect back" prefix={symbol} value={receivables} onChange={setReceivables} />
            <Field label="Stock for resale" hint="If you run a business" prefix={symbol} value={tradeGoods} onChange={setTradeGoods} />
            <Field label="Debts due now" hint="Not a whole long-term loan" prefix={symbol} value={debts} onChange={setDebts} />
          </div>
        </Step>

        {currencies.length > 0 && (
          <Step n={3} title={`What these are worth in ${currency}`} status={totals.missingRates.length === 0 ? "done" : "todo"} subtitle={`Some of what you hold isn't in ${currency}. Enter today's rate for each.`} onHelp={() => help("currency")}>
            <RatesPanel base={currency} currencies={currencies} rates={rateInputs} missing={totals.missingRates} onChange={(c, v) => setRateInputs((cur) => ({ ...cur, [c]: v }))} />
          </Step>
        )}

        <Step n={currencies.length > 0 ? 4 : 3} title="The threshold (nisab)" status={priced ? "done" : "todo"} subtitle="Zakat is due only if your net wealth reaches it. Choose the measure your scholar follows." onHelp={() => help("nisab")}>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["silver", "gold"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBasis(option)}
                aria-pressed={basis === option}
                className={`rounded-2xl border p-4 text-left transition-all ${basis === option ? "border-[var(--color-brand)] ring-1 ring-[var(--color-brand)]" : "border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]"}`}
              >
                <span className="flex items-center justify-between">
                  <span className="font-semibold capitalize">{option}</span>
                  <span className={`grid size-5 place-items-center rounded-full border ${basis === option ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white" : "border-[var(--color-rule-strong)]"}`}>
                    {basis === option && <Check className="size-3" />}
                  </span>
                </span>
                <span className="mt-1 block text-sm text-[var(--color-ink-soft)]">
                  {option === "silver" ? `${NISAB_SILVER_GRAMS}g of silver. Usually lower, so more people owe.` : `${NISAB_GOLD_GRAMS}g of gold. Usually higher.`}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4">
            {basis === "gold" ? (
              <Field label="Today's gold price" hint="Per gram, from a jeweller or published rate" prefix={symbol} suffix="per gram" value={goldPrice} onChange={setGoldPrice} />
            ) : (
              <Field label="Today's silver price" hint="Per gram, from a jeweller or published rate" prefix={symbol} suffix="per gram" value={silverPrice} onChange={setSilverPrice} />
            )}
          </div>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--color-rule)] p-4">
            <input type="checkbox" checked={solarYear} onChange={(e) => setSolarYear(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-brand)]" />
            <span className="text-sm">
              <span className="font-semibold">I keep my zakat year by the Gregorian calendar</span>
              <span className="block text-[var(--color-ink-soft)]">
                Some scholars raise the rate to 2.577% to cover the extra days.{" "}
                <button type="button" className="font-semibold text-[var(--color-brand)] hover:underline" onClick={() => help("solar")}>Why?</button>
              </span>
            </span>
          </label>
        </Step>

        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-[var(--color-ink-faint)]">
          <span>Your figures are saved in this browser as you type.</span>
          <button
            type="button"
            className="flex items-center gap-1.5 font-medium hover:text-[var(--color-over)]"
            onClick={() => {
              if (window.confirm("Clear every figure you have entered on this device?")) {
                clearSaved();
                window.location.reload();
              }
            }}
          >
            <RotateCcw className="size-4" /> Start over
          </button>
        </div>
      </div>

      <ResultPanel
        priced={priced}
        hasHoldings={hasHoldings}
        basis={basis}
        solarYear={solarYear}
        metalPrice={basis === "gold" ? num(goldPrice) : num(silverPrice)}
        result={result}
        totals={totals}
        onHelp={help}
        fmt={fmt}
        currency={currency}
      />
    </div>
    <PrintableZakatStatement
      priced={priced}
      basis={basis}
      metalPrice={basis === "gold" ? num(goldPrice) : num(silverPrice)}
      solarYear={solarYear}
      currency={currency}
      result={result}
      totals={totals}
      fmt={fmt}
    />
    </>
  );
}

function Step({ n, title, subtitle, status, onHelp, children }: { n: number; title: string; subtitle: string; status: "done" | "todo" | "optional"; onHelp?: () => void; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby={`step-${n}`}>
      <div className="flex items-start gap-3.5">
        <span className={`grid size-9 shrink-0 place-items-center rounded-md text-sm font-extrabold ${status === "done" ? "bg-[var(--color-teal)] text-white" : "border-2 border-[var(--color-ink)] text-[var(--color-ink)]"}`}>
          {status === "done" ? <Check className="size-4" /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={`step-${n}`} className="text-xl font-extrabold">{title}</h2>
            {status === "optional" && <span className="rounded-full bg-[var(--color-wash)] px-2 py-0.5 text-xs font-medium text-[var(--color-ink-soft)]">Optional</span>}
            {onHelp && (
              <button type="button" onClick={onHelp} aria-label={`Help: ${title}`} className="ml-auto text-[var(--color-ink-faint)] hover:text-[var(--color-brand)]">
                <CircleHelp className="size-5" />
              </button>
            )}
          </div>
          <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 sm:pl-[2.875rem]">{children}</div>
    </section>
  );
}

function ResultPanel({
  priced,
  hasHoldings,
  basis,
  solarYear,
  metalPrice,
  result,
  totals,
  onHelp,
  fmt,
  currency,
}: {
  fmt: (n: number) => string;
  currency: string;
  priced: boolean;
  hasHoldings: boolean;
  basis: NisabBasis;
  solarYear: boolean;
  metalPrice: number;
  result: ReturnType<typeof computeZakat>;
  totals: ReturnType<typeof aggregate>;
  onHelp: (t: HelpTopic) => void;
}) {
  const [records, setRecords] = useRecords();
  const account = useAccount();
  const [saved, setSaved] = useState(false);
  const groups = groupByCategory(totals.lines);
  const weakest = weakestConfidence(totals.lines);
  const ratio = result.nisabValue > 0 ? result.netWealth / result.nisabValue : 0;

  function save() {
    const now = new Date();
    setRecords([
      { id: `${now.getTime()}`, savedAt: now.toISOString(), label: `Zakat calculation, ${now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`, zakatDue: result.zakatDue, netWealth: result.netWealth, nisabValue: result.nisabValue, basis, rate: result.rate, currency },
      ...records,
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  }

  return (
    <>
      <aside id="result" className="scroll-mt-24 lg:sticky lg:top-24">
        <div className="card overflow-hidden !border-[var(--color-ink)]">
          <div className={`border-b-2 px-5 py-3 text-sm font-extrabold sm:px-6 ${!priced ? "border-[var(--color-rule)] bg-[var(--color-wash)] text-[var(--color-ink-soft)]" : result.meetsNisab ? "border-[var(--color-ink)] bg-[var(--color-brand)] text-white" : "border-[var(--color-ink)] bg-[var(--color-gold-soft)] text-[var(--color-gold)]"}`}>
            {!priced ? "Your result" : result.meetsNisab ? "Zakat is due" : "Below the threshold: no zakat due"}
          </div>
          <div className="p-5 sm:p-6">
            {!priced ? (
              <div className="py-4 text-center">
                <Scale className="mx-auto size-10 text-[var(--color-ink-faint)]" />
                <p className="mt-3 font-semibold">{hasHoldings ? `Add today's ${basis} price` : "Your result will appear here"}</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-[var(--color-ink-soft)]">
                  {hasHoldings ? "Once the threshold is set, you'll see whether zakat is due and how much." : "Add what you hold, then set the threshold."}
                </p>
                {hasHoldings && (
                  <p className="mt-4 rounded-xl bg-[var(--color-wash)] p-3 text-sm">
                    So far: <span className="font-mono-nums font-semibold">{fmt(result.netWealth)}</span> net
                  </p>
                )}
              </div>
            ) : (
              <>
                <AnimatePresence initial={false}>
                  {!totals.complete &&
                    totals.warnings.map((w) => (
                      <motion.p key={w} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3 flex items-start gap-2 overflow-hidden rounded-xl bg-[var(--color-gold-soft)] p-3 text-sm">
                        <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-[var(--color-short)]" />
                        <span>{w}</span>
                      </motion.p>
                    ))}
                </AnimatePresence>

                <div className="answer p-4">
                <p className="eyebrow !text-[var(--color-ink)]">{result.meetsNisab ? "You owe" : "Zakat due"}</p>
                <p className="figure-xl mt-1 text-5xl leading-tight">
                  <AnimatedNumber value={result.zakatDue} format={fmt} />
                </p>
                </div>
                <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
                  {result.meetsNisab
                    ? `${(result.rate * 100).toFixed(result.rate === 0.025 ? 1 : 3)}% of ${fmt(result.netWealth)}${!totals.complete ? ", so far" : ""}`
                    : `You are ${fmt(result.shortfall)} below the ${basis} threshold.`}
                </p>

                <div className="mt-5 space-y-1.5">
                  <Meter ratio={ratio} met={result.meetsNisab} />
                  <div className="flex justify-between text-xs text-[var(--color-ink-faint)]">
                    <span>Net wealth</span>
                    <span>Nisab {fmt(result.nisabValue)}</span>
                  </div>
                </div>

                <dl className="mt-5 space-y-1.5 border-t border-[var(--color-rule)] pt-4 text-sm">
                  {[
                    ["Total assets", fmt(result.totalAssets)],
                    ["Less debts due now", `− ${fmt(totals.immediateDebts)}`],
                    ["Net zakatable wealth", fmt(result.netWealth)],
                  ].map(([l, v], i) => (
                    <div key={l} className={`flex justify-between gap-4 ${i === 2 ? "font-semibold" : ""}`}>
                      <dt className={i === 2 ? "" : "text-[var(--color-ink-soft)]"}>{l}</dt>
                      <dd className="font-mono-nums">{v}</dd>
                    </div>
                  ))}
                </dl>

                {groups.length > 0 && (
                  <details className="group mt-4 rounded-xl border border-[var(--color-rule)]">
                    <summary className="flex cursor-pointer items-center justify-between px-3.5 py-2.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                      See the working, account by account
                      <ArrowDown className="size-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="space-y-3 border-t border-[var(--color-rule)] p-3.5">
                      {groups.map((g) => (
                        <div key={g.category}>
                          <div className="flex items-center justify-between gap-4 text-sm font-medium">
                            <span className="flex items-center gap-1.5"><CategoryIcon category={g.category} className="size-3.5 text-[var(--color-brand)]" />{CATEGORY_LABELS[g.category]}</span>
                            <span className="font-mono-nums">{fmt(g.total)}</span>
                          </div>
                          <ul className="mt-1 space-y-0.5">
                            {g.lines.map((line, i) => (
                              <li key={`${line.sourceId}-${i}`} className="flex justify-between gap-4 text-xs text-[var(--color-ink-soft)]">
                                <span className="truncate">{line.sourceLabel}{line.home !== line.original.amount && ` (${formatMoney(line.original)})`}</span>
                                <span className="shrink-0 font-mono-nums">{line.home === null ? "no rate yet" : fmt(line.home)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {weakest && weakest !== "stated" && (
                  <p className="mt-3 text-xs text-[var(--color-ink-soft)]">The least certain figure here was {CONFIDENCE_NOTES[weakest].toLowerCase()}. Check it before you pay.</p>
                )}

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={save} className="btn btn-primary w-full">
                    {saved ? <><CheckCircle2 className="size-4" /> Saved to your records</> : <><Save className="size-4" /> Save this calculation</>}
                  </button>
                  <button type="button" onClick={() => window.print()} className="btn btn-ghost w-full">
                    <Printer className="size-4" /> Print statement
                  </button>
                </div>
                <p className="mt-2 text-center text-xs text-[var(--color-ink-faint)]">
                  {account.email ? (
                    <Link href="/account" className="hover:underline">See your saved calculations</Link>
                  ) : (
                    <>Saved in this browser. <Link href="/signup" className="font-semibold text-[var(--color-brand)] hover:underline">Create an account</Link> to keep them on every device.</>
                  )}
                </p>
              </>
            )}
          </div>
        </div>
        <p className="mt-3 px-1 text-xs leading-relaxed text-[var(--color-ink-faint)]">
          Due on wealth held for a full lunar year.{" "}
          <button type="button" className="font-semibold hover:text-[var(--color-brand)]" onClick={() => onHelp("hawl")}>What is the hawl?</button>
        </p>
      </aside>

      {/* On a phone the result is below the steps, so the amount rides along at the bottom. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-rule)] bg-[var(--color-card)]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[var(--color-ink-soft)]">{!priced ? "Set the threshold to see" : result.meetsNisab ? "Zakat due" : "Below nisab"}</p>
            <p className="font-mono-nums text-xl font-semibold">{priced ? fmt(result.zakatDue) : "—"}</p>
          </div>
          <a href="#result" className="btn btn-primary btn-sm">See result <ArrowDown className="size-4" /></a>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Zakat al-Fitr                                                       */
/* ------------------------------------------------------------------ */

function FitrCalculator({ help, currency, symbol }: { help: (t: HelpTopic) => void; currency: string; symbol: string }) {
  const fmt = (n: number) => formatIn(n, currency);
  const [people, setPeople] = usePersistentState("fitr:people", "1");
  const [price, setPrice] = usePersistentState("fitr:price", "");
  const r = zakatAlFitr(num(people), num(price));
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <section className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Your household</h2>
            <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">One sa&apos;, about {SAA_KILOGRAMS}kg of the local staple, for each person, paid before the Eid prayer.</p>
          </div>
          <button type="button" onClick={() => help("fitr")} aria-label="Help: zakat al-Fitr" className="text-[var(--color-ink-faint)] hover:text-[var(--color-brand)]"><CircleHelp className="size-5" /></button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="People in your household" hint="Including children and dependants" value={people} onChange={setPeople} />
          <Field label="Price of your staple" hint="Rice, maize: what you would give" prefix={symbol} suffix="per kg" value={price} onChange={setPrice} />
        </div>
      </section>
      <aside className="card overflow-hidden lg:sticky lg:top-24">
        <div className="bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white sm:px-6">To give before Eid</div>
        <div className="p-5 sm:p-6">
          <p className="eyebrow">Food</p>
          <p className="mt-3 font-mono-nums text-4xl font-semibold leading-tight">{r.kilograms.toFixed(1)} kg</p>
          <p className="mt-4 eyebrow">At the price you entered</p>
          <p className="mt-1 font-mono-nums text-2xl font-semibold">{num(price) > 0 ? <AnimatedNumber value={r.cost} format={fmt} /> : "—"}</p>
          <p className="mt-4 text-xs leading-relaxed text-[var(--color-ink-faint)]">Whether money may be given instead of food is a question for your scholar.</p>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Monthly plan                                                        */
/* ------------------------------------------------------------------ */

function BudgetPlanner({ currency, symbol }: { currency: string; symbol: string }) {
  const fmt = (n: number) => formatIn(n, currency);
  const [income, setIncome] = usePersistentState("budget:income", "");
  const [fixed, setFixed] = usePersistentState("budget:fixed", "");
  const [sadaqahPercent, setSadaqahPercent] = usePersistentState("budget:sadaqah", "5");
  const [savingsPercent, setSavingsPercent] = usePersistentState("budget:savings", "20");
  const [spent, setSpent] = usePersistentState("budget:spent", "");

  const split = splitAllowance({ monthlyIncome: num(income), fixedCosts: num(fixed), sadaqahShare: num(sadaqahPercent) / 100, savingsShare: num(savingsPercent) / 100 });
  const daysLeft = daysLeftInMonth(new Date());
  const perDay = dailyAllowance(split.spending, num(spent), daysLeft);
  const total = Math.max(1, split.fixedCosts + split.sadaqah + split.savings + split.spending);
  const parts = [
    ["Fixed costs", split.fixedCosts, "var(--color-ink-faint)"],
    ["Sadaqah", split.sadaqah, "var(--color-gold-bright)"],
    ["Savings", split.savings, "var(--color-brand-bright)"],
    ["Yours to spend", split.spending, "var(--color-brand)"],
  ] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Your month</h2>
        <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">Sadaqah and savings come out with your fixed costs, not from whatever is left at the end, which in practice is nothing. The shares are a starting point.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Monthly income or allowance" hint="Everything that comes in" prefix={symbol} value={income} onChange={setIncome} />
          <Field label="Fixed costs" hint="Rent, transport, data: the unavoidable ones" prefix={symbol} value={fixed} onChange={setFixed} />
          <Field label="Sadaqah" suffix="% of what's left" value={sadaqahPercent} onChange={setSadaqahPercent} />
          <Field label="Savings" suffix="% of what's left" value={savingsPercent} onChange={setSavingsPercent} />
          <Field label="Spent so far this month" prefix={symbol} value={spent} onChange={setSpent} />
        </div>
      </section>
      <aside className="card overflow-hidden lg:sticky lg:top-24">
        {num(income) <= 0 ? (
          <div className="p-6 text-center">
            <Coins className="mx-auto size-10 text-[var(--color-ink-faint)]" />
            <p className="mt-3 font-semibold">Your plan will appear here</p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Start with what comes in each month.</p>
          </div>
        ) : split.overspent ? (
          <div className="p-6">
            <p className="flex items-center gap-2 font-semibold text-[var(--color-over)]"><TriangleAlert className="size-5" /> Fixed costs are {fmt(-split.surplus)} more than you have</p>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">There is nothing to split yet. That is worth sorting out before planning anything else.</p>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <p className="eyebrow">You can spend</p>
            <p className="mt-3 font-mono-nums text-4xl font-semibold leading-tight"><AnimatedNumber value={perDay} format={fmt} /></p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">a day for the {daysLeft} day{daysLeft === 1 ? "" : "s"} left this month</p>
            <div className="mt-5 flex h-3 overflow-hidden rounded-full">
              {parts.map(([l, v, c]) => <span key={l} style={{ width: `${(v / total) * 100}%`, background: c }} />)}
            </div>
            <dl className="mt-4 space-y-1.5 text-sm">
              {parts.map(([l, v, c]) => (
                <div key={l} className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2 text-[var(--color-ink-soft)]"><span className="size-2.5 rounded-full" style={{ background: c }} />{l}</dt>
                  <dd className="font-mono-nums">{fmt(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </aside>
    </div>
  );
}
