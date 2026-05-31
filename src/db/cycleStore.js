import { getDB } from './index'
import { parseDate } from '../utils/date'

/**
 * 排班周期模式数据操作
 *
 * 数据结构：
 * {
 *   personId: "person_xxx",
 *   cycleDays: 7,
 *   startDate: "2026-06-01",      // 周期起始日期
 *   pattern: [
 *     { dayOffset: 0, shiftId: "shift-morning" },
 *     { dayOffset: 1, shiftId: "shift-afternoon" },
 *     ...
 *   ],
 *   excludedDates: ["2026-06-05", "2026-06-10"],  // 手动排除的日期
 *   title: "我的排班周期",
 *   updatedAt: 1234567890
 * }
 */

export async function getCyclePattern(personId) {
  const db = await getDB()
  return db.get('cyclePatterns', personId)
}

export async function saveCyclePattern(pattern) {
  const db = await getDB()
  const data = {
    personId: pattern.personId,
    cycleDays: pattern.cycleDays,
    startDate: pattern.startDate,
    pattern: pattern.pattern,
    excludedDates: pattern.excludedDates || [],
    title: pattern.title || '排班周期',
    updatedAt: Date.now(),
  }
  await db.put('cyclePatterns', data)
  return data
}

export async function deleteCyclePattern(personId) {
  const db = await getDB()
  await db.delete('cyclePatterns', personId)
}

export async function getAllCyclePatterns() {
  const db = await getDB()
  return db.getAll('cyclePatterns')
}

/**
 * 添加某天到周期排除列表（该天不再被周期填充）
 */
export async function excludeDateFromCycle(personId, dateStr) {
  const pattern = await getCyclePattern(personId)
  if (!pattern) return
  const excluded = pattern.excludedDates || []
  if (!excluded.includes(dateStr)) {
    excluded.push(dateStr)
    pattern.excludedDates = excluded
    pattern.updatedAt = Date.now()
    const db = await getDB()
    await db.put('cyclePatterns', pattern)
  }
  return pattern
}

/**
 * 从排除列表中移除某天（恢复周期填充）
 */
export async function unexcludeDateFromCycle(personId, dateStr) {
  const pattern = await getCyclePattern(personId)
  if (!pattern) return
  const excluded = (pattern.excludedDates || []).filter((d) => d !== dateStr)
  pattern.excludedDates = excluded
  pattern.updatedAt = Date.now()
  const db = await getDB()
  await db.put('cyclePatterns', pattern)
  return pattern
}

/**
 * 根据周期模式计算某天的班次 ID
 * @param {Object} pattern - 周期模式对象
 * @param {string} dateStr - 日期 YYYY-MM-DD
 * @returns {string|null} shiftId 或 null（排除的日期返回 null）
 */
export function getShiftIdFromCycle(pattern, dateStr) {
  if (!pattern || !pattern.pattern || pattern.pattern.length === 0) return null

  // 排除列表中的日期不应用周期
  if (pattern.excludedDates && pattern.excludedDates.includes(dateStr)) return null

  const startDate = parseDate(pattern.startDate)
  const date = parseDate(dateStr)
  const diff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24))

  if (diff < 0) return null

  const patternIndex = diff % pattern.cycleDays
  const entry = pattern.pattern[patternIndex]
  return entry ? entry.shiftId || null : null
}
