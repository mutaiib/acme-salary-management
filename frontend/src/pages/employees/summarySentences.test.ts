// FR-01, FR-02, FR-03: the pay of the listed employees, in plain words.
import { expect, test } from 'vitest'
import type { EmployeeSummary } from '../../api/types'
import { summaryFigures, summarySentences } from './summarySentences'

const GERMANY_ENGINEERING: EmployeeSummary = {
  headcount: 340,
  payroll_cost_minor: 2_142_655_200,
  reporting_currency: 'USD',
  has_one_currency: true,
  salary: { currency: 'EUR', min_minor: 2_400_000, median_minor: 5_170_000, max_minor: 17_040_000 },
}

test('gives the number of active employees as the first figure', () => {
  expect(summaryFigures(GERMANY_ENGINEERING)[0]).toEqual({
    label: 'Active employees',
    value: '340',
    hint: 'In this list',
  })
})

test('gives the payroll cost for one year in the reporting currency', () => {
  expect(summaryFigures(GERMANY_ENGINEERING)[1]).toEqual({
    label: 'Payroll cost',
    value: '$21.43M',
    fullValue: '$21,426,552',
    hint: 'For one year, in USD',
  })
})

test('gives the median salary in the currency of the salaries, with its meaning', () => {
  expect(summaryFigures(GERMANY_ENGINEERING)[2]).toEqual({
    label: 'Median salary',
    value: '€51,700',
    hint: 'For one year, in EUR',
    help: 'The median is the middle salary. Half of these employees get less, and half get more.',
  })
})

test('gives no figure when no active employee matches', () => {
  expect(summaryFigures({ ...GERMANY_ENGINEERING, headcount: 0, salary: null })).toEqual([])
})

test('states the lowest and the highest salary in one sentence', () => {
  expect(summarySentences(GERMANY_ENGINEERING)).toEqual([
    'The lowest salary is €24,000, and the highest is €170,400.',
  ])
})

test('does not explain the currency when the salaries have the reporting currency only', () => {
  const unitedStates: EmployeeSummary = {
    ...GERMANY_ENGINEERING,
    salary: { ...GERMANY_ENGINEERING.salary!, currency: 'USD' },
  }

  expect(summarySentences(unitedStates)).toHaveLength(1)
})

test('states that salaries of different currencies are in the reporting currency', () => {
  const allCountries: EmployeeSummary = {
    ...GERMANY_ENGINEERING,
    has_one_currency: false,
    salary: { ...GERMANY_ENGINEERING.salary!, currency: 'USD' },
  }

  expect(summarySentences(allCountries).at(-1)).toBe(
    'They are in USD, because these employees have different currencies.',
  )
})

test('does not compare salaries when the list has one active employee', () => {
  expect(summarySentences({ ...GERMANY_ENGINEERING, headcount: 1 })).toEqual([])
})

test('gives no sentence when no active employee matches', () => {
  expect(summarySentences({ ...GERMANY_ENGINEERING, headcount: 0, salary: null })).toEqual([])
})
