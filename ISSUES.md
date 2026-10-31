# Good first issues

Comment on the matching GitHub issue to claim one.

Difficulty: 🟢 gentle · 🟡 straightforward code · 🔴 needs some thought or a conversation

---

### 1. 🟢 Format numbers as they are typed

**Problem.** Entering `1200000` gives no feedback until you reach the result. It is
genuinely easy to type one zero too many and not notice, and the whole answer is then
wrong by a factor of ten.

**Task.** Show the value grouped as `1,200,000` while the student types, without
fighting the cursor. The parser already strips commas, so the logic needs no change.

**Files.** `components/Field.tsx`.

**Watch out for.** Reformatting on every keystroke commonly throws the caret to the
end of the input. Test editing the middle of a number.

---

### 2. 🟢 Explain what counts and what does not

**Problem.** The hints are one line each. "Stock for resale" and "money owed to you"
genuinely confuse people, and a student unsure whether something counts will guess.

**Task.** Add an expandable note to each field with two or three concrete examples of
what counts and what does not. Keep it factual and uncontroversial; anything scholars
differ on belongs in an issue first.

**Files.** `components/Field.tsx`, `app/page.tsx`.

---

### 3. 🟡 A printable summary

**Problem.** The app insists the student should check the result with someone
qualified, and then gives them no way to take the working with them.

**Task.** A print stylesheet, or a "copy summary" button, producing the inputs,
the nisab basis and price used, and the result — enough for somebody else to check.

**Files.** `app/page.tsx`, `app/globals.css`.

---

### 4. 🟡 Remember the metal price between visits

**Problem.** The silver price has to be looked up and retyped every single time, which
is exactly the friction the project exists to remove.

**Task.** Store the last metal price and the date it was entered in `localStorage`,
and show how old it is — "entered 12 days ago, check it is still right". Do **not**
store asset figures; those stay in the session only.

**Files.** New `lib/storage.ts`, `app/page.tsx`.

**Watch out for.** A stale price shown without its date is worse than no price.

---

### 5. 🟡 A hawl reminder

**Problem.** Zakat is due on wealth held for a full lunar year, and the app says so in
small print while doing nothing about it. Knowing *when* your year turns is half the
problem.

**Task.** Let the student record the Hijri date their zakat year began and show when
the next one falls. Hijri date conversion is the interesting part — do it in a pure
function with tests, and no library if you can manage it.

**Files.** New `lib/hijri.ts` **with tests**, `app/page.tsx`.

---

### 6. 🟢 Translate the interface

**Problem.** English only. This is material plenty of students would rather read in
Yoruba or Hausa, and the vocabulary is not everyday English in any of them.

**Task.** Move user-facing strings into one module and add a second language. Get the
religious terms checked by somebody who would use them — transliteration choices here
matter more than in ordinary UI copy.

**Files.** New `lib/strings.ts`, then everywhere a string is written.

---

### 7. 🔴 Zakat on gold jewellery

**Problem.** The app has one "gold and silver" field taking a cash value. In practice
the live question for a lot of families is whether jewellery in regular personal use is
zakatable at all — and schools differ on it.

**Task.** Research the positions, write them up in the issue, and propose a design
that presents the choice without taking a side. **Discussion before code.**

**Files.** `lib/zakat.ts`, `app/page.tsx`, tests.

---

### 8. 🟡 Round the result sensibly, and upward

**Problem.** The result shows exact naira — `₦32,500`, but also `₦32,487`. Many people
prefer to round zakat up to be safe.

**Task.** Offer an optional round-up to the nearest ₦100 or ₦1,000, clearly labelled as
giving *more* than calculated, never less. Show both figures.

**Files.** `lib/zakat.ts`, `lib/zakat.test.ts`, `app/page.tsx`.

---

### 9. 🟡 Make the monthly plan cover a term, not a month

**Problem.** Student money does not arrive monthly. It arrives in lumps at the start of
a term and has to last until the next one, which is the actual budgeting problem and
not the one the app solves.

**Task.** Let the student set an arbitrary period with a start and end date, and base
the daily figure on that instead of the calendar month.

**Files.** `lib/budget.ts`, `lib/budget.test.ts`, `app/page.tsx`.

---

### 10. 🟢 Check the whole app with a screen reader

**Problem.** The `Field` component was fixed after a screen reader announced one input
as "CashIn hand, current account, mobile money₦". Nobody has checked the rest — the
tab navigation, the result panel that appears and changes, the nisab toggle buttons.

**Task.** Go through it with VoiceOver or NVDA and write up what you hear. Fix what you
can; open issues for what you cannot. Announcing the result when it changes is likely
to need a live region.

**Files.** `app/page.tsx`, `components/Field.tsx`.
