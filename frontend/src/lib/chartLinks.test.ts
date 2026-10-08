// FR-20: the addresses from a chart to the lists.
import { expect, test } from 'vitest'
import { bracketHref, outlierHref } from './chartLinks'

const BACK = '/analysis?tab=outliers&group_by=department'
const BACK_PARAMETER = 'back=%2Fanalysis%3Ftab%3Doutliers%26group_by%3Ddepartment'

test('opens the active employees of a salary bracket from the distribution chart', () => {
  const href = bracketHref({ from_minor: 4_000_000, to_minor: 6_000_000, headcount: 3 }, '/analysis')

  expect(href).toBe(
    '/employees?status=active&salary_from_minor=4000000&salary_to_minor=6000000&back=%2Fanalysis',
  )
})

test('opens the outliers of a country with the status of the part', () => {
  expect(outlierHref('country', 'DE', 'below', BACK)).toBe(
    `/pay-health?status=below&country=DE&${BACK_PARAMETER}`,
  )
})

test('opens the outliers of a department and of a job level with their own parameter', () => {
  expect(outlierHref('department', 'Sales', 'above', BACK)).toContain('&department=Sales&')
  expect(outlierHref('job_level', '3', 'above', BACK)).toContain('&job_level=3&')
})

test('writes a group name with a space or a sign so that the list reads it back', () => {
  const href = outlierHref('department', 'Research & Development', 'below', BACK)

  const params = new URL(href, 'http://localhost').searchParams
  expect(params.get('department')).toBe('Research & Development')
  expect(params.get('back')).toBe(BACK)
})

test('writes no mark other than the way back', () => {
  const params = new URL(outlierHref('country', 'DE', 'below', BACK), 'http://localhost').searchParams

  expect(params.has('from')).toBe(false)
  expect(params.has('from_tab')).toBe(false)
})
