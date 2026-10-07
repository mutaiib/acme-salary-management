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
  /** The meaning of the figure, for the info button beside its label. */
  help?: string
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
      help: 'The median is the middle salary. Half of these employees get less, and half get more.',
    },
  ]
}

/**
 * The lowest and the highest salary, in one sentence, and the currency when the salaries
 * have more than one. One employee gives no sentence, because there is no comparison.
 */
export function summarySentences(summary: EmployeeSummary): string[] {
  const { headcount, salary } = summary
  if (headcount <= 1 || !salary) {
    return []
  }
  const money = (amountMinor: number) => formatMoney(amountMinor, salary.currency)

  const sentences = [
    `The lowest salary is ${money(salary.min_minor)}, and the highest is ${money(salary.max_minor)}.`,
  ]
  if (!summary.has_one_currency) {
    sentences.push(`They are in ${salary.currency}, because these employees have different currencies.`)
  }
  return sentences
}
