import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getHolidayInfo, isStatutoryHoliday, isMakeupWorkday } from './holidays.js'

test('法定放假日返回假日名称', () => {
  assert.deepEqual(getHolidayInfo('2025-01-01'), { name: '元旦', isWorkday: false })
  assert.deepEqual(getHolidayInfo('2025-10-01'), { name: '国庆中秋', isWorkday: false })
  assert.deepEqual(getHolidayInfo('2025-10-08'), { name: '国庆中秋', isWorkday: false })
  assert.deepEqual(getHolidayInfo('2026-02-17'), { name: '春节', isWorkday: false })
  assert.deepEqual(getHolidayInfo('2026-02-23'), { name: '春节', isWorkday: false })
  assert.equal(isStatutoryHoliday('2026-10-04'), true)
})

test('调休补班日返回关联假日', () => {
  assert.deepEqual(getHolidayInfo('2026-01-04'), { name: '元旦', isWorkday: true })
  assert.deepEqual(getHolidayInfo('2026-02-14'), { name: '春节', isWorkday: true })
  assert.deepEqual(getHolidayInfo('2025-10-11'), { name: '国庆中秋', isWorkday: true })
  assert.equal(isMakeupWorkday('2026-09-20'), true)
  assert.equal(isStatutoryHoliday('2026-01-04'), false)
})

test('普通日期返回 null', () => {
  assert.equal(getHolidayInfo('2026-06-22'), null)
  assert.equal(getHolidayInfo('2024-10-01'), null)
  assert.equal(getHolidayInfo('2027-01-01'), null)
})
