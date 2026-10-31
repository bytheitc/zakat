# Contributing to Zakat Kit

Thanks for being here.

## Before anything else

```bash
pnpm install
pnpm test
```

You should never need an API key, a `.env` file, a database, or access to anything
belonging to MSSN UNILAG.

## Read this first: religious content

This project calculates something people are obliged to get right, which puts a
constraint on it that most side projects do not have.

**Where scholars differ, add an option — never a default.** The gold-versus-silver
nisab, the lunar-versus-solar rate, food versus money for Zakat al-Fitr: each is
presented as a choice with the position named. A pull request that resolves one of
these in code, however well-sourced, will be asked to make it configurable instead.

**Never present the output as a ruling.** The app says it is a calculator in its
first paragraph and shows its working underneath every result. Please keep both.
Wording that implies the app has decided something for the user — "you must pay",
"your zakat is" — is worth changing even where the arithmetic is right.

**Name the judgement calls.** `ZAKAT_RATE`, `SAA_KILOGRAMS`,
`RELEARN_LAPSE_THRESHOLD`-style constants exist so that a reader can see what is a
fixed value and what is a decision somebody made. Do not inline them.

**If you are unsure, open an issue rather than a pull request.** Nobody will think
less of you for asking.

## House style

**Comments explain why, not what.** The comment above `netWealth` in
[`lib/zakat.ts`](./lib/zakat.ts) explains why the field is called `immediateDebts` and
what goes wrong if a student subtracts a whole student loan. Write that kind.

**TypeScript, strict. No `any`.**

**Pure functions in `lib/`.** Everything there is a pure function over plain numbers,
which is why it can be tested without a browser. React state lives in `app/` and
`components/`.

**No network calls.** Not for prices, not for anything. This is a hard rule — see the
README for why.

## Tests

Anything in `lib/` needs a test, and the arithmetic ones should read as statements
about money: `"returns exactly zero below nisab, not a small number"`. Edge cases
worth covering in anything you add: exactly at the threshold, negative net wealth, and
zero.

```bash
pnpm test
pnpm test:watch
```

## Accessibility

Every input needs a real label. The `Field` component wires `htmlFor` and
`aria-describedby` explicitly — there is a comment in it explaining the screen-reader
bug that caused, which was found by actually checking rather than by reading the code.
Please check your own additions the same way.

## Pull requests

- One topic per pull request.
- Say what problem it solves.
- Run `pnpm test` and `pnpm typecheck` before pushing.
- Screenshots for anything visual.
