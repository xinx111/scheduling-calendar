import { parseDate } from '../utils/date.js'

/**
 * 排班周期计算（纯函数，不依赖数据库）
 */

/**
 * 计算某天应应用的周期（取起始日期 <= 该天的最近周期）
 */
function findApplicableCycle(cycles, dateStr) {
  if (!cycles || cycles.length === 0) return null
  // 按起始日期降序排，找第一个起始日期 <= dateStr 的
  const sorted = [...cycles].sort((a, b) => (a.startDate > b.startDate ? -1 : 1))
  for (const cycle of sorted) {
    if (cycle.startDate <= dateStr) {
      return cycle
    }
  }
  return null
}

/**
 * 根据所有周期模式计算某天的班次 ID
 * @param {Array} cycles - 某人的所有周期
 * @param {string} dateStr - 日期 YYYY-MM-DD
 * @returns {string|null} shiftId 或 null
 */
export function getShiftIdFromCycle(cycles, dateStr) {
  const cycle = findApplicableCycle(cycles, dateStr)
  if (!cycle) return null

  // 排除列表中的日期
  if (cycle.excludedDates && cycle.excludedDates.includes(dateStr)) return null

  const startDate = parseDate(cycle.startDate)
  const date = parseDate(dateStr)
  const diff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24))

  if (diff < 0 || !cycle.pattern) return null

  const patternIndex = diff % cycle.cycleDays
  // 必须按 dayOffset 匹配：留空的 day 不参与存储顺序，按下标取会整体错位
  const entry = Array.isArray(cycle.pattern)
    ? cycle.pattern.find((p) => p && p.dayOffset === patternIndex)
    : null
  return entry ? entry.shiftId || null : null
}
