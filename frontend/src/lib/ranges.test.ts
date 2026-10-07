// FR-08: the position of an amount on a salary band.
import { expect, test } from 'vitest'
import { band } from '../test/data'
import { positionOnBand } from './ranges'

const BAND = band(1, { min_minor: 3_500_000, mid_minor: 5_000_000, max_minor: 6_500_000 })

test('the minimum is at 0 and the maximum is at 100', () => {
  expect(positionOnBand(3_500_000, BAND)).toBe(0)
  expect(positionOnBand(6_500_000, BAND)).toBe(100)
})

test('an amount in the band is at its part of the band width', () => {
  expect(positionOnBand(4_500_000, BAND)).toBe(33)
})

test('an amount below the band stays at 0', () => {
  expect(positionOnBand(3_000_000, BAND)).toBe(0)
})

test('an amount above the band stays at 100', () => {
  expect(positionOnBand(9_000_000, BAND)).toBe(100)
})
