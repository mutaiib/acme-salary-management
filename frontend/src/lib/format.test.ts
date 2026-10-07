// FR-01, FR-02, FR-11: the formats of money, dates and percentages.
import { expect, test } from 'vitest'
import { formatCount, formatDate, formatGap, formatMoney, formatShare } from './format'

test('formats a whole amount without minor units', () => {
  expect(formatMoney(6_500_000, 'USD')).toBe('$65,000')
})

test('formats an amount that has minor units with 2 decimal places', () => {
  expect(formatMoney(6_500_050, 'USD')).toBe('$65,000.50')
})

test('formats an amount with the symbol of its currency', () => {
  expect(formatMoney(250_000_000, 'INR')).toBe('₹2,500,000')
})

test('formats a count with a separator for thousands', () => {
  expect(formatCount(10_000)).toBe('10,000')
})

test('formats an ISO date as day, month and year', () => {
  expect(formatDate('2025-06-01')).toBe('1 Jun 2025')
})

test('formats the date of an ISO date and time', () => {
  expect(formatDate('2025-06-03T09:00:00')).toBe('3 Jun 2025')
})

test('formats a share of a total with 1 decimal place', () => {
  expect(formatShare(22_000_000, 35_800_000)).toBe('61.5%')
})

test('formats a share of a total of zero as zero', () => {
  expect(formatShare(0, 0)).toBe('0.0%')
})

test('formats a whole gap with 1 decimal place', () => {
  expect(formatGap(2)).toBe('2.0%')
})

test('formats a negative gap with a minus sign', () => {
  expect(formatGap(-0.9)).toBe('-0.9%')
})
