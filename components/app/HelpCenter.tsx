"use client";

import { BookOpen, CalendarClock, CircleHelp, Coins, FileSpreadsheet, Gem, Globe, Lock, ReceiptText, Scale } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS } from "@/lib/zakat";

export type HelpTopic = "start" | "nisab" | "hawl" | "debts" | "jewellery" | "solar" | "imports" | "currency" | "fitr" | "privacy";

const TOPICS: { id: HelpTopic; label: string; icon: React.ReactNode }[] = [
  { id: "start", label: "Getting started", icon: <BookOpen /> },
  { id: "nisab", label: "The threshold (nisab)", icon: <Scale /> },
  { id: "hawl", label: "The zakat year (hawl)", icon: <CalendarClock /> },
  { id: "debts", label: "Which debts come off", icon: <ReceiptText /> },
  { id: "jewellery", label: "Gold and silver jewellery", icon: <Gem /> },
  { id: "solar", label: "2.5% or 2.577%", icon: <CircleHelp /> },
  { id: "imports", label: "Importing statements", icon: <FileSpreadsheet /> },
  { id: "currency", label: "Dollars, crypto, gold", icon: <Globe /> },
  { id: "fitr", label: "Zakat al-Fitr", icon: <Coins /> },
  { id: "privacy", label: "Your data", icon: <Lock /> },
];

/** Every part of the calculator explained in one place; opened from the header or any "?" link. */
export function HelpCenter({ open, onClose, topic, onTopic, onReplayTour }: { open: boolean; onClose: () => void; topic: HelpTopic; onTopic: (t: HelpTopic) => void; onReplayTour: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Help" description="How the calculator works, and the questions behind it." wide>
      <div className="grid gap-6 sm:grid-cols-[13rem_1fr]">
        <nav aria-label="Help topics" className="-mx-1 flex gap-1 overflow-x-auto pb-1 sm:mx-0 sm:flex-col sm:overflow-visible">
          {TOPICS.map((t) => (
            <button key={t.id} type="button" onClick={() => onTopic(t.id)} aria-current={topic === t.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors [&_svg]:size-4 ${topic === t.id ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)]" : "text-[var(--color-ink-soft)] hover:bg-[var(--color-wash)]"}`}>
              {t.icon}{t.label}
            </button>
          ))}
          <button type="button" onClick={onReplayTour} className="mt-2 hidden rounded-xl border border-dashed border-[var(--color-rule-strong)] px-3 py-2 text-left text-sm font-semibold text-[var(--color-brand)] sm:block">Replay the welcome tour</button>
        </nav>
        <article className="min-w-0 text-[15px] leading-relaxed text-[var(--color-ink-soft)] [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--color-ink)] [&_p+p]:mt-3 [&_strong]:text-[var(--color-ink)]">
          <Topic id={topic} />
        </article>
      </div>
    </Modal>
  );
}

function Topic({ id }: { id: HelpTopic }) {
  switch (id) {
    case "start":
      return (<>
        <h3>Getting started</h3>
        <p><strong>1. Add your accounts.</strong> Drop in bank statements, or skip straight to typing figures. Each account keeps its own line.</p>
        <p><strong>2. Add anything else you hold:</strong> cash at home, gold, money owed to you, stock for resale, and debts due now.</p>
        <p><strong>3. Set the threshold:</strong> choose gold or silver and enter today&apos;s price per gram.</p>
        <p>Your result updates as you type, on the right (or at the bottom on a phone). Your figures are saved in this browser, so you can come back to them.</p>
      </>);
    case "nisab":
      return (<>
        <h3>The threshold (nisab)</h3>
        <p>Zakat is only due if your net wealth reaches the nisab: the value of <strong>{NISAB_GOLD_GRAMS}g of gold</strong> or <strong>{NISAB_SILVER_GRAMS}g of silver</strong>.</p>
        <p>Scholars hold both. The silver threshold is usually far lower, so more people owe zakat under it; many scholars recommend it for that reason. Ask your scholar which they follow.</p>
        <p>Prices change daily. Enter today&apos;s price per gram from a jeweller or a published rate.</p>
      </>);
    case "hawl":
      return (<>
        <h3>The zakat year (hawl)</h3>
        <p>Zakat is due on wealth that has stayed at or above nisab for a full lunar year. Many people pick a fixed date, often in Ramadan, and pay each year on that date.</p>
        <p>The calculator works out the amount on the figures you enter. Whether your year has passed is for you to know.</p>
      </>);
    case "debts":
      return (<>
        <h3>Which debts come off</h3>
        <p>Only <strong>debts due now</strong>: this month&apos;s repayment, bills you owe, money you must hand back soon.</p>
        <p>Not the whole of a long-term loan such as a mortgage or student loan. Subtracting all of it would wipe out zakat that is genuinely owed.</p>
      </>);
    case "jewellery":
      return (<>
        <h3>Gold and silver jewellery</h3>
        <p>Gold and silver held as savings or investment are entered with your other wealth. For jewellery kept for personal adornment and worn regularly, scholars differ:</p>
        <p>The Hanafi view counts the jewellery. The majority view (Maliki, Shafi'i and Hanbali) generally exempts permissible personal-use jewellery. The scope of that exemption can depend on how the jewellery is used and what is customary.</p>
        <p>Choose the view you follow. This calculator presents both positions and does not issue a religious ruling. Ask a scholar you trust if you are unsure.</p>
        <p>Sources: <a className="font-semibold text-[var(--color-brand)] underline underline-offset-2" href="https://www.dar-alifta.org/en/fatwa/details/7733/paying-zakat-on-jewelry" target="_blank" rel="noreferrer">Egypt&apos;s Dar al-Ifta</a> and <a className="font-semibold text-[var(--color-brand)] underline underline-offset-2" href="https://islamqa.org/hanafi/islamicportal/118223/zakah-on-jewellery/" target="_blank" rel="noreferrer">a Hanafi fatwa from IslamicPortal</a>.</p>
      </>);
    case "solar":
      return (<>
        <h3>2.5% or 2.577%</h3>
        <p>Zakat is one fortieth, 2.5%, of zakatable wealth held for a lunar year.</p>
        <p>A solar year is about eleven days longer. Some scholars hold that if you keep your zakat year by the Gregorian calendar, the rate rises to about <strong>2.577%</strong> to make up the difference. The calculator has a switch for it.</p>
      </>);
    case "imports":
      return (<>
        <h3>Importing statements</h3>
        <p>Drop in a statement as <strong>CSV, OFX, QFX, QIF or JSON</strong>. The file is read in your browser and never uploaded.</p>
        <p>Only a PDF? Copy the table from it and paste it. If two statements look like the same account, you will be asked before anything is counted twice.</p>
      </>);
    case "currency":
      return (<>
        <h3>Dollars, crypto, gold</h3>
        <p>Choose your currency at the top of the calculator. Accounts in any other currency, and crypto, are converted to it at rates you enter, so the total is always in one currency. Nothing is converted without a rate from you.</p>
        <p>Gold and silver count at what they would sell for today.</p>
      </>);
    case "fitr":
      return (<>
        <h3>Zakat al-Fitr</h3>
        <p>Paid for each person in the household before the Eid prayer: one sa&apos;, about 2.5kg, of the local staple food.</p>
        <p>Whether it may be given as money is a question for your scholar. The calculator shows the measure and what it costs.</p>
      </>);
    case "privacy":
      return (<>
        <h3>Your data</h3>
        <p>Without an account, nothing you enter leaves this browser. Statements are read on your device.</p>
        <p>With an account, your figures are encrypted in your browser with a key made from your password before they are stored. We cannot read them, and nor could anyone who broke in.</p>
      </>);
  }
}
