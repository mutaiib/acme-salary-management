// NFR-04: the conversion between currency units and minor units in the UI.
import { expect, test } from 'vitest'
import { toMinor, toUnits } from './money'

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
