import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getShiftIdFromCycle } from './cyclePattern.js'

const pattern = [
  { dayOffset: 0, shiftId: 'shift-a' },
  { dayOffset: 1, shiftId: '' },
  { dayOffset: 2, shiftId: 'shift-b' },
]

const cycles = [
  {
    cycleDays: 3,
    startDate: '2026-01-01',
    pattern,
    excludedDates: [],
  },
]

test('周期按 dayOffset 匹配，留空天不会挤占后续天', () => {
  assert.equal(getShiftIdFromCycle(cycles, '2026-01-01'), 'shift-a')
  assert.equal(getShiftIdFromCycle(cycles, '2026-01-02'), null)
  assert.equal(getShiftIdFromCycle(cycles, '2026-01-03'), 'shift-b')
  assert.equal(getShiftIdFromCycle(cycles, '2026-01-04'), 'shift-a')
})

test('早于周期起始日与排除日不生效', () => {
  assert.equal(getShiftIdFromCycle(cycles, '2025-12-31'), null)

  const excluded = [{ ...cycles[0], excludedDates: ['2026-01-01'] }]
  assert.equal(getShiftIdFromCycle(excluded, '2026-01-01'), null)
})
