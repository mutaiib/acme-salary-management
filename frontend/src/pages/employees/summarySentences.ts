import type { EmployeeSummary } from '../../api/types'
import { formatCount, formatMoney, formatMoneyShort } from '../../lib/format'

/** Rounds a total to whole currency units. The minor units of a large total add no meaning. */
function wholeUnits(amountMinor: number): number {
  return Math.round(amountMinor / 100) * 100
}

export interface SummaryFigure {
  label: string
  value: string
  /** The value with all its digits, when `value` is a short form. */
  fullValue?: string
  /** The unit and the period of the value. */
  hint: string
}

/** The headline figures of the listed employees: the number, the cost and the median salary. */
export function summaryFigures(summary: EmployeeSummary): SummaryFigure[] {
  const { headcount, salary } = summary
  if (headcount === 0 || !salary) {
    return []
  }
  return [
    { label: 'Active employees', value: formatCount(headcount), hint: 'In this list' },
    {
      label: 'Payroll cost',
      value: formatMoneyShort(summary.payroll_cost_minor, summary.reporting_currency),
      fullValue: formatMoney(wholeUnits(summary.payroll_cost_minor), summary.reporting_currency),
      hint: `For one year, in ${summary.reporting_currency}`,
    },
    {
      label: 'Median salary',
      value: formatMoney(salary.median_minor, salary.currency),
      hint: `For one year, in ${salary.currency}`,
    },
  ]
}

/**
 * The figures in plain words: the meaning of the median salary, and the lowest and
 * the highest salary. One employee gives no sentence, because there is no comparison.
 */
export function summarySentences(summary: EmployeeSummary): string[] {
  const { headcount, salary } = summary
  if (headcount <= 1 || !salary) {
    return []
  }
  const money = (amountMinor: number) => formatMoney(amountMinor, salary.currency)

  const sentences = [
    'Half of these employees get less than the median salary, and half get more.',
    `The lowest salary is ${money(salary.min_minor)}. The highest salary is ${money(salary.max_minor)}.`,
  ]
  if (!summary.has_one_currency) {
    sentences.push(
      `These salaries are in ${salary.currency}, because these employees have different currencies.`,
    )
  }
  return sentences
}
