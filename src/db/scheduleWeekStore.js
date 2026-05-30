import { getDB } from './index'

/**
 * 排班表批次数据操作（按周分组管理）
 */

function generateId() {
  return `week_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 获取所有排班表批次
 */
export async function getAllSchedules() {
  const db = await getDB()
  return db.getAll('schedules').then((list) =>
    list.sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1))
  )
}

/**
 * 根据周起始日期获取排班表
 */
export async function getScheduleByWeekStart(weekStart) {
  const db = await getDB()
  const index = db.transaction('schedules').store.index('weekStart')
  const results = await index.getAll(weekStart)
  return results[0] || null
}

/**
 * 创建或更新排班表批次
 */
export async function saveSchedule(scheduleData) {
  const db = await getDB()

  // 检查是否已存在该周
  const existing = await getScheduleByWeekStart(scheduleData.weekStart)

  const now = Date.now()
  const schedule = {
    id: existing ? existing.id : generateId(),
    weekStart: scheduleData.weekStart,
    weekEnd: scheduleData.weekEnd,
    title: scheduleData.title || `${scheduleData.weekStart} 周排班`,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
    sourceImage: scheduleData.sourceImage || existing?.sourceImage || null,
  }

  await db.put('schedules', schedule)
  return schedule
}

/**
 * 删除排班表批次（同时删除该周的排班记录）
 */
export async function deleteSchedule(id) {
  const db = await getDB()
  const schedule = await db.get('schedules', id)
  if (!schedule) return

  // 删除该周的所有排班记录
  const recordIndex = db.transaction('scheduleRecords').store.index('date')
  const records = await recordIndex.getAll(
    IDBKeyRange.bound(schedule.weekStart, schedule.weekEnd)
  )
  const tx = db.transaction('scheduleRecords', 'readwrite')
  for (const record of records) {
    await tx.store.delete(record.id)
  }
  await tx.done

  // 删除批次本身
  await db.delete('schedules', id)
}
