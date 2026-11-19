import React from "react";
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS, ZAKAT_RATE, ZAKAT_RATE_SOLAR_YEAR, type NisabBasis, type ZakatResult } from "@/lib/zakat";
import { formatMoney } from "@/lib/money";
import type { Aggregation } from "@/lib/sources/aggregate";
import { groupByCategory } from "@/lib/sources/aggregate";
import { CATEGORY_LABELS } from "@/lib/sources/types";

export interface PrintableZakatStatementProps {
  readonly priced: boolean;
  readonly basis: NisabBasis;
  readonly metalPrice: number;
  readonly solarYear: boolean;
  readonly currency: string;
  readonly result: ZakatResult;
  readonly totals: Aggregation;
  readonly fmt: (amount: number) => string;
}

export function PrintableZakatStatement({
  priced,
  basis,
  metalPrice,
  solarYear,
  currency,
  result,
  totals,
  fmt,
}: PrintableZakatStatementProps) {
  const groups = groupByCategory(totals.lines);
  const basisGrams = basis === "gold" ? NISAB_GOLD_GRAMS : NISAB_SILVER_GRAMS;
  const rate = solarYear ? ZAKAT_RATE_SOLAR_YEAR : ZAKAT_RATE;

  let status: string;
  let statusDetail: string;

  if (!priced) {
    status = "Incomplete calculation";
    statusDetail = `Today's ${basis} price has not been entered, so the nisab threshold cannot be completed.`;
  } else if (!totals.complete) {
    status = "Incomplete calculation";
    statusDetail = "One or more figures need currency conversion. The amount shown below is provisional and may be too low or too high.";
  } else if (result.meetsNisab) {
    status = "Zakat is due";
    statusDetail = "This is a calculation for review, not a religious ruling.";
  } else {
    status = "Below the threshold: no zakat due";
    statusDetail = `The net amount is ${fmt(result.shortfall)} below the selected nisab threshold.`;
  }

  return (
    <article id="printable-zakat-statement" className="printable-zakat-statement" aria-labelledby="print-title">
      <header className="print-header">
        <div>
          <p className="print-eyebrow">Zakat Kit</p>
          <h1 id="print-title">Zakat calculation statement</h1>
        </div>
        <p className="print-currency">{currency}</p>
      </header>

      <p className="print-disclaimer">
        A calculator, not a religious ruling. Review the result and its working with someone qualified.
      </p>

      <section className="print-status" aria-label="Calculation status">
        <p className="print-status-label">Calculation status</p>
        <h2>{status}</h2>
        <p>{statusDetail}</p>
      </section>

      <section className="print-section" aria-labelledby="print-summary-heading">
        <h2 id="print-summary-heading">Calculation summary</h2>
        <dl className="print-summary">
          <div>
            <dt>Total assets</dt>
            <dd>{fmt(result.totalAssets)}</dd>
          </div>
          <div>
            <dt>Less debts due now</dt>
            <dd>− {fmt(totals.immediateDebts)}</dd>
          </div>
          <div>
            <dt>Net zakatable wealth</dt>
            <dd>{fmt(result.netWealth)}</dd>
          </div>
          <div>
            <dt>Selected nisab basis</dt>
            <dd className="print-capitalized">{basis} nisab</dd>
          </div>
          <div>
            <dt>{basis} price per gram</dt>
            <dd>{priced ? fmt(metalPrice) : "Not entered"}</dd>
          </div>
          <div>
            <dt>Nisab threshold</dt>
            <dd>{priced ? fmt(result.nisabValue) : `${basisGrams}g × price not entered`}</dd>
          </div>
          <div>
            <dt>Year basis</dt>
            <dd>{solarYear ? "Gregorian / solar year: 2.577%" : "Lunar year: 2.5%"}</dd>
          </div>
          <div>
            <dt>Zakat rate used</dt>
            <dd>{(rate * 100).toFixed(rate === ZAKAT_RATE ? 1 : 3)}%</dd>
          </div>
          <div className="print-summary-result">
            <dt>{!priced || !totals.complete ? "Provisional zakat due" : "Zakat due"}</dt>
            <dd>{priced ? fmt(result.zakatDue) : "Not complete"}</dd>
          </div>
        </dl>
      </section>

      {(!totals.complete || totals.warnings.length > 0) && (
        <section className="print-section print-warnings" aria-labelledby="print-incomplete-heading">
          <h2 id="print-incomplete-heading">Incomplete or unconverted figures</h2>
          {totals.warnings.map((warning) => <p key={warning}>{warning}</p>)}
          {totals.unconverted.map((line) => (
            <p key={`${line.sourceId}-${line.category}-${line.original.currency}`}>
              {line.sourceLabel}: {formatMoney(line.original)} — no conversion rate entered.
            </p>
          ))}
          {totals.debtLines.filter((debt) => debt.home === null).map((debt) => (
            <p key={debt.sourceId}>
              {debt.sourceLabel}: debt of {formatMoney(debt.original)} was not deducted because no conversion rate was entered.
            </p>
          ))}
        </section>
      )}

      <section className="print-section" aria-labelledby="print-breakdown-heading">
        <h2 id="print-breakdown-heading">Account and asset breakdown</h2>
        {groups.length === 0 ? (
          <p className="print-empty">No included asset figures were entered.</p>
        ) : (
          <div className="print-breakdown">
            {groups.map((group) => (
              <section key={group.category} className="print-category">
                <h3>{CATEGORY_LABELS[group.category]}</h3>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Source</th>
                      <th scope="col">Original amount</th>
                      <th scope="col">Included amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.lines.map((line, index) => (
                      <tr key={`${line.sourceId}-${index}`}>
                        <td>{line.sourceLabel}</td>
                        <td>{formatMoney(line.original)}</td>
                        <td>{line.home === null ? "No rate yet" : fmt(line.home)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row" colSpan={2}>Category total</th>
                      <td>{fmt(group.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </section>
            ))}
          </div>
        )}

        {totals.debtLines.length > 0 && (
          <div className="print-debt-list">
            <h3>Debts due now</h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">Source</th>
                  <th scope="col">Original amount</th>
                  <th scope="col">Deducted amount</th>
                </tr>
              </thead>
              <tbody>
                {totals.debtLines.map((debt) => (
                  <tr key={debt.sourceId}>
                    <td>{debt.sourceLabel}</td>
                    <td>{formatMoney(debt.original)}</td>
                    <td>{debt.home === null ? "No rate yet" : fmt(debt.home)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="print-footer">
        <p>Due on wealth held for a full lunar year; check the hawl with a qualified person.</p>
        {totals.excludedSources > 0 && (
          <p>{totals.excludedSources} excluded {totals.excludedSources === 1 ? "source was" : "sources were"} not included in this calculation.</p>
        )}
      </footer>
    </article>
  );
}
