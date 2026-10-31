# Zakat Kit

**A zakat calculator and allowance planner for students — honest about what it is not.**

---

## The problem

Most students assume zakat is not their concern. It is something their father works
out, on wealth they do not have. Then somebody is holding ₦1.4m of saved school fees
in an account for eight months and nobody has mentioned that this might matter.

The reason it stays unexamined is that finding out is awkward. Working out whether
you have reached nisab means knowing what nisab *is*, knowing today's silver price,
knowing which of your things count, and knowing what to subtract. That is four
lookups and some arithmetic, which is just enough friction that the question goes
unasked for another year.

The second half of the problem is the month-to-month one. Students intend to give
sadaqah and intend to save, and both come out of whatever is left at the end of the
month — which is nothing. Giving that is planned last is giving that never happens.

## What it does

- **Zakat on wealth** — enter what you hold and what you owe now, pick the gold or
  silver nisab, enter today's metal price, and see the amount with the full working
  shown. Below the threshold it tells you how far below, which is the thing students
  actually want to know.
- **Zakat al-Fitr** — one sa' (about 2.5kg) per person, priced at your local staple.
- **Monthly plan** — splits an allowance with sadaqah and savings taken out *at the
  same time as fixed costs*, then gives you a daily figure for what is left of the
  month based on what you have already spent.

## What it is not

**This is a calculator, not a ruling.** It does arithmetic on numbers you enter. It
makes no attempt to settle questions scholars differ on, and where they differ it
offers both and names them:

- **Gold or silver nisab** — the silver threshold is usually the lower one, so more
  people owe on it. Which applies to you is not a question a web page can answer.
- **Lunar or solar year** — if you reckon your zakat year on the Gregorian calendar,
  some scholars raise the rate from 2.5% to 2.577% to cover the extra eleven days.
  It is a checkbox, not a default.
- **Zakat al-Fitr in food or money** — the app shows you the measure in kilograms
  *and* its cost, and does not tell you which to give.

Nothing is stored, nothing is sent anywhere, and there is no account. Close the tab
and it is gone.

## Setup

Requires **Node 20+** and **pnpm**.

```bash
git clone https://github.com/bytheitc/zakat.git
```

```bash
cd zakat
```

```bash
pnpm install
```

```bash
pnpm dev
```

Open <http://localhost:3000>. No `.env`, no API key, no database.

### Other commands

```bash
pnpm test
```

```bash
pnpm typecheck
```

```bash
pnpm build
```

## Design decisions

**No price API.** Metal prices are typed in by the student. Fetching them would make
the app need a network and a key, and — worse — would make a number that must be
correct on the day look like it had been handled for you. Typing it in keeps the
responsibility where it belongs, and the app works offline.

**The result always shows its working.** Total assets, debts deducted, net wealth and
the nisab figure are all displayed, so the student can show somebody qualified how the
number was reached rather than just the number.

**No answer until there is a threshold.** With no metal price entered the result panel
says so instead of showing ₦0 due. A zero that means "you have not finished entering
your data" and a zero that means "you owe nothing" must never look alike.

**`immediateDebts`, not `debts`.** Only debts due now are deducted. Naming the field
loosely would invite a student to subtract an entire student loan and wipe out a zakat
they genuinely owe.

**Sadaqah and savings come out of the surplus, not of gross income.** Applying the
percentages to gross would ask a student whose hostel fees eat 90% of their allowance
to save a tenth of money that does not exist.

**Overspending is surfaced, not clamped.** If fixed costs exceed income the app says
so plainly and points at the welfare desk, rather than quietly showing zeroes.

## Contributing

This is one of four projects indexed at **[https://github.com/mssnunilag/oss](https://github.com/mssnunilag/oss)** — the others cover prayer times, Qur'an memorisation, halal food and zakat, and share this one's conventions.

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) — it has a section on religious
content that matters more here than in most projects. Drafted starter tasks are in
[ISSUES.md](./ISSUES.md).

Built for Hacktoberfest by [MSSN UNILAG](https://github.com/bytheitc). Not an official MSSN
product, and nothing in it constitutes a religious ruling.

## Licence

[MIT](./LICENSE).
