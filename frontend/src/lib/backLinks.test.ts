// FR-03, FR-09, FR-19, FR-20: the way back from a list or a record to the screen that opened it.
import { expect, test } from 'vitest'
import { listBack, recordBack, recordHref } from './backLinks'

const paramsOf = (back: string | null) =>
  new URLSearchParams(back === null ? '' : { back })

const EMPLOYEES = { href: '/employees', label: 'Back to Employees' }

test('puts the address of the list, with its filters, in the address of the record', () => {
  expect(recordHref(7, '/employees', '?country=IN&page=3')).toBe(
    '/employees/7?back=%2Femployees%3Fcountry%3DIN%26page%3D3',
  )
})

test('goes back to the Employees list with the filters that it had', () => {
  const back = '/employees?status=active&salary_from_minor=4000000&salary_to_minor=6000000'

  expect(recordBack(paramsOf(back))).toEqual({ href: back, label: 'Back to Employees' })
})

test('goes back to the Pay health list with the filters that it had', () => {
  expect(recordBack(paramsOf('/pay-health?status=below&country=US'))).toEqual({
    href: '/pay-health?status=below&country=US',
    label: 'Back to Pay health',
  })
})

test('goes back to the tab of Pay analysis that the record came from', () => {
  expect(recordBack(paramsOf('/analysis?tab=highest&country=DE'))).toEqual({
    href: '/analysis?tab=highest&country=DE',
    label: 'Back to Pay analysis',
  })
})

test('keeps an address with a parameter that names a different site, because it stays in the system', () => {
  const back = '/employees?next=https://evil.example'

  expect(recordBack(paramsOf(back))).toEqual({ href: back, label: 'Back to Employees' })
  expect(listBack(paramsOf(back))).toEqual({ href: back, label: 'Back to Employees' })
})

test('goes back to the Employees list when the record has no way back', () => {
  expect(recordBack(paramsOf(null))).toEqual(EMPLOYEES)
})

const REFUSED = [
  'https://example.com/employees',
  '//example.com/employees',
  '/\\example.com',
  'javascript:alert(1)',
  '/employees/',
  '/unknown',
  'employees',
]

test.each(REFUSED)(
  'goes back to the Employees list when the way back is not a list of the system: %s',
  (back) => {
    expect(recordBack(paramsOf(back))).toEqual(EMPLOYEES)
  },
)

test('gives the way back to Pay analysis for a list that a chart opened', () => {
  expect(listBack(paramsOf('/analysis?tab=outliers&group_by=department'))).toEqual({
    href: '/analysis?tab=outliers&group_by=department',
    label: 'Back to Pay analysis',
  })
})

test('gives no way back to a list that no screen opened', () => {
  expect(listBack(paramsOf(null))).toBeNull()
  expect(listBack(new URLSearchParams('status=active'))).toBeNull()
})

test.each(REFUSED)('gives no way back to a list when the way back is not a list of the system: %s', (back) => {
  expect(listBack(paramsOf(back))).toBeNull()
})
