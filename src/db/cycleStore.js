import { getDB } from './index'
export { getShiftIdFromCycle } from './cyclePattern.js'

/**
 * 排班周期模式数据操作
 *
 * 支持一人多个周期，每个周期独立起始日期。
 * 计算某天的班次时，取起始日期小于等于该天的最新的周期。
 *
 * 数据结构：
 * {
 *   id: "cycle_xxx",
 *   personId: "person_xxx",
 *   cycleDays: 7,
 *   startDate: "2026-06-01",      // 周期起始日期
 *   pattern: [
 *     { dayOffset: 0, shiftId: "shift-morning" },
 *     ...
 *   ],
 *   excludedDates: ["2026-06-05"],  // 手动排除的日期
 *   title: "张三的排班周期",
 *   updatedAt: 1234567890
 * }
 */

function generateId() {
  return `cycle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 获取某人的所有周期模式（按起始日期降序）
 */
export async function getPersonCycles(personId) {
  const db = await getDB()
  const all = await db.getAll('cyclePatterns')
  return all
    .filter((c) => c.personId === personId)
    .sort((a, b) => (a.startDate > b.startDate ? -1 : 1))
}

/**
 * 保存一个周期（新增，不影响已有周期）
 */
export async function saveCyclePattern(pattern) {
  const db = await getDB()
  const data = {
    id: generateId(),
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

/**
 * 删除某个周期
 */
export async function deleteCyclePattern(cycleId) {
  const db = await getDB()
  await db.delete('cyclePatterns', cycleId)
}

/**
 * 批量删除某人的所有周期
 */
export async function deleteAllPersonCycles(personId) {
  const cycles = await getPersonCycles(personId)
  const db = await getDB()
  for (const c of cycles) {
    await db.delete('cyclePatterns', c.id)
  }
}

/**
 * 获取所有周期模式
 */
export async function getAllCyclePatterns() {
  const db = await getDB()
  return db.getAll('cyclePatterns')
}
