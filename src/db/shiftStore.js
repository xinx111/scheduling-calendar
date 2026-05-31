import { getDB } from './index'

/**
 * 班次模板数据操作
 */

function generateId() {
  return `shift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 获取所有班次模板
 */
export async function getAllShifts() {
  const db = await getDB()
  return db.getAll('shiftTemplates')
}

/**
 * 根据 ID 获取班次
 */
export async function getShift(id) {
  const db = await getDB()
  return db.get('shiftTemplates', id)
}

/**
 * 添加自定义班次
 */
export async function addShift(shiftData) {
  const db = await getDB()
  const shift = {
    id: generateId(),
    name: shiftData.name,
    shortName: shiftData.shortName || shiftData.name.charAt(0),
    startTime: shiftData.startTime || null,
    endTime: shiftData.endTime || null,
    color: shiftData.color || '#6B7280',
    icon: shiftData.icon || '📋',
    isDefault: false,
  }
  await db.put('shiftTemplates', shift)
  return shift
}

/**
 * 更新班次
 */
export async function updateShift(id, updates) {
  const db = await getDB()
  const shift = await db.get('shiftTemplates', id)
  if (!shift) throw new Error(`Shift not found: ${id}`)

  const updated = { ...shift, ...updates }
  await db.put('shiftTemplates', updated)
  return updated
}

/**
 * 删除班次（同时清理排班记录和周期中的引用）
 */
export async function deleteShift(id) {
  const db = await getDB()
  const shift = await db.get('shiftTemplates', id)
  if (!shift) throw new Error(`Shift not found: ${id}`)

  await db.delete('shiftTemplates', id)

  // 将使用该班次的排班记录置空
  const schedIndex = db.transaction('scheduleRecords').store.index('shiftId')
  const records = await schedIndex.getAll(id)
  if (records.length > 0) {
    const tx = db.transaction('scheduleRecords', 'readwrite')
    for (const record of records) {
      record.shiftId = null
      await tx.store.put(record)
    }
    await tx.done
  }

  // 将周期中引用了该班次的 pattern 条目置空
  const allCycles = await db.getAll('cyclePatterns')
  for (const cycle of allCycles) {
    let changed = false
    for (const p of cycle.pattern) {
      if (p.shiftId === id) {
        p.shiftId = ''
        changed = true
      }
    }
    if (changed) {
      cycle.updatedAt = Date.now()
      await db.put('cyclePatterns', cycle)
    }
  }
}
