// FR-01, FR-02: the formats of money, dates and percentages.
import { expect, test } from 'vitest'
import {
  formatCount,
  formatDate,
  formatJobLevel,
  formatMoney,
  formatMoneyShort,
  formatRate,
  formatRecordedDate,
  formatShare,
} from './format'

test('formats an exchange rate without zeros at the end', () => {
  expect(formatRate(1_080_000)).toBe('1.08')
  expect(formatRate(12_000)).toBe('0.012')
  expect(formatRate(1_000_000)).toBe('1')
})

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

test('formats a job level with the word Level', () => {
  expect(formatJobLevel(3)).toBe('Level 3')
})

test('formats a total of millions in a short form', () => {
  expect(formatMoneyShort(56_768_345_500, 'USD')).toBe('$567.68M')
})

test('formats a total of thousands in a short form', () => {
  expect(formatMoneyShort(35_800_000, 'USD')).toBe('$358K')
})

test('keeps all digits of a total below 100,000', () => {
  expect(formatMoneyShort(6_500_000, 'USD')).toBe('$65,000')
})

test('formats the time of a record as a date in the time zone of the HR Manager', () => {
  // 19:22 UTC on 7 October is 00:52 on 8 October in India.
  expect(formatRecordedDate('2026-10-07T19:22:00', 'Asia/Kolkata')).toBe('8 Oct 2026')
  expect(formatRecordedDate('2026-10-07T19:22:00', 'UTC')).toBe('7 Oct 2026')
})
