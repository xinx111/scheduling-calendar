import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getMonthCalendarGrid, getWeekRange, parseDate } from './date.js'

test('日历网格按周一开头对齐表头', () => {
  const grid = getMonthCalendarGrid(2026, 10)
  // 2026-10-01 是周四，周一开头的网格应落在下标 3
  assert.equal(grid[3].date, '2026-10-01')

  for (const [index, cell] of grid.entries()) {
    const mondayFirst = (parseDate(cell.date).getDay() + 6) % 7
    assert.equal(
      index % 7,
      mondayFirst,
      `${cell.date} 应落在周一开头的第 ${mondayFirst} 列`
    )
  }
})

test('周范围从周一到周日', () => {
  const range = getWeekRange(parseDate('2026-10-04'))
  assert.equal(range.weekStart, '2026-09-28')
  assert.equal(range.weekEnd, '2026-10-04')
})
