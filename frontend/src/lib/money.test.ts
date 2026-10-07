// NFR-04, FR-04: the conversion between currency units and minor units, and a salary increase.
import { expect, test } from 'vitest'
import { changePct, raisedBy, toMinor, toUnits } from './money'

test('converts whole units to minor units', () => {
  expect(toMinor(65_000)).toBe(6_500_000)
})

test('converts units with a fraction to minor units without a float error', () => {
  // 19.99 * 100 is 1998.9999999999998 in floating-point arithmetic.
  expect(toMinor(19.99)).toBe(1_999)
})

test('converts an empty input to zero, so that the API refuses it with a cause', () => {
  expect(toMinor(null)).toBe(0)
})

test('converts minor units to units', () => {
  expect(toUnits(6_500_050)).toBe(65_000.5)
})

test('raises a salary by a percentage', () => {
  expect(raisedBy(6_500_000, 10)).toBe(7_150_000)
})

test('raises a salary to a whole number of currency units', () => {
  // 65,432 raised by 3.5% is 67,722.12.
  expect(raisedBy(6_543_200, 3.5)).toBe(6_772_200)
})

test('lowers a salary for a negative percentage', () => {
  expect(raisedBy(6_500_000, -10)).toBe(5_850_000)
})

test('gives the change between two salaries in percent with 1 decimal place', () => {
  expect(changePct(6_500_000, 7_150_000)).toBe(10)
  expect(changePct(6_000_000, 6_250_000)).toBe(4.2)
  expect(changePct(6_500_000, 5_850_000)).toBe(-10)
})
