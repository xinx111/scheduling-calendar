import { getDB } from './index'

/**
 * 排班周期模式数据操作
 *
 * 周期模式让用户定义一套 N 天循环的排班模板，
 * 查看日历时自动填充未手动排班的日期。
 *
 * 数据结构：
 * {
 *   personId: "person_xxx",
 *   cycleDays: 7,
 *   startDate: "2026-05-25",      // 模板起始日期 (YYYY-MM-DD)
 *   pattern: [
 *     { dayOffset: 0, shiftId: "shift-morning" },  // 第1天
 *     { dayOffset: 1, shiftId: "shift-afternoon" }, // 第2天
 *     ...
 *   ],
 *   title: "我的排班周期",
 *   updatedAt: 1234567890
 * }
 */

/**
 * 获取某人的排班周期模式
 */
export async function getCyclePattern(personId) {
  const db = await getDB()
  return db.get('cyclePatterns', personId)
}

/**
 * 保存排班周期模式
 */
export async function saveCyclePattern(pattern) {
  const db = await getDB()
  const data = {
    personId: pattern.personId,
    cycleDays: pattern.cycleDays,
    startDate: pattern.startDate,
    pattern: pattern.pattern,
    title: pattern.title || '排班周期',
    updatedAt: Date.now(),
  }
  await db.put('cyclePatterns', data)
  return data
}

/**
 * 删除排班周期模式
 */
export async function deleteCyclePattern(personId) {
  const db = await getDB()
  await db.delete('cyclePatterns', personId)
}

/**
 * 获取所有周期模式
 */
export async function getAllCyclePatterns() {
  const db = await getDB()
  return db.getAll('cyclePatterns')
}

/**
 * 根据周期模式计算某天的班次 ID
 * @param {Object} pattern - 周期模式对象
 * @param {string} dateStr - 日期 YYYY-MM-DD
 * @returns {string|null} shiftId 或 null
 */
export function getShiftIdFromCycle(pattern, dateStr) {
  if (!pattern || !pattern.pattern || pattern.pattern.length === 0) return null

  const startDate = new Date(pattern.startDate + 'T00:00:00')
  const date = new Date(dateStr + 'T00:00:00')
  const diff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24))

  // 日期在周期开始之前 → 不应用
  if (diff < 0) return null

  const patternIndex = diff % pattern.cycleDays
  const entry = pattern.pattern[patternIndex]
  return entry ? entry.shiftId || null : null
}
