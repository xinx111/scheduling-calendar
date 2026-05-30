import { getDB } from './index'

/**
 * 排班记录数据操作
 */

function generateId() {
  return `sched_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 获取某人的所有排班记录（按日期排序）
 */
export async function getPersonSchedules(personId) {
  const db = await getDB()
  const index = db.transaction('scheduleRecords').store.index('personId')
  return index.getAll(personId).then((records) =>
    records.sort((a, b) => (a.date < b.date ? -1 : 1))
  )
}

/**
 * 获取某人在某个日期范围的排班
 */
export async function getPersonSchedulesInRange(personId, startDate, endDate) {
  const db = await getDB()
  const index = db.transaction('scheduleRecords').store.index('personId+date')
  const range = IDBKeyRange.bound(
    [personId, startDate],
    [personId, endDate]
  )
  return index.getAll(range)
}

/**
 * 获取某天的所有排班记录
 */
export async function getSchedulesByDate(date) {
  const db = await getDB()
  const index = db.transaction('scheduleRecords').store.index('date')
  return index.getAll(date)
}

/**
 * 获取某天某个班次的所有人员（同班同事）
 */
export async function getColleaguesByDateAndShift(date, shiftId) {
  const db = await getDB()
  const index = db.transaction('scheduleRecords').store.index('date+shiftId')
  return index.getAll(IDBKeyRange.bound([date, shiftId], [date, shiftId]))
}

/**
 * 添加排班记录
 */
export async function addScheduleRecord(personId, date, shiftId, source = 'manual') {
  const db = await getDB()
  // 检查是否已存在（同人同天只能有一个班次）
  const index = db.transaction('scheduleRecords').store.index('personId+date')
  const existing = await index.getAll(
    IDBKeyRange.bound([personId, date], [personId, date])
  )

  if (existing.length > 0) {
    // 更新已有记录
    const existingRecord = existing[0]
    existingRecord.shiftId = shiftId
    existingRecord.updatedAt = Date.now()
    existingRecord.source = source
    await db.put('scheduleRecords', existingRecord)
    return existingRecord
  }

  // 新建记录
  const record = {
    id: generateId(),
    personId,
    date,
    shiftId,
    source,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  await db.put('scheduleRecords', record)
  return record
}

/**
 * 批量添加排班记录（用于 AI 识别结果导入）
 * 自动跳过/覆盖同人同天的重复记录
 */
export async function addScheduleRecords(records) {
  const db = await getDB()
  const results = []
  const uniqueKey = new Set()

  for (const r of records) {
    // 去重：同一人的同一天只保留最后一条
    const key = `${r.personId}|${r.date}`
    if (uniqueKey.has(key)) continue
    uniqueKey.add(key)

    // 检查是否已有排班记录
    const index = db.transaction('scheduleRecords').store.index('personId+date')
    const existing = await index.getAll(
      IDBKeyRange.bound([r.personId, r.date], [r.personId, r.date])
    )

    if (existing.length > 0) {
      // 更新已有记录
      const existingRecord = existing[0]
      existingRecord.shiftId = r.shiftId
      existingRecord.updatedAt = Date.now()
      existingRecord.source = r.source || 'ai'
      await db.put('scheduleRecords', existingRecord)
      results.push(existingRecord)
    } else {
      // 新建记录
      const record = {
        id: generateId(),
        personId: r.personId,
        date: r.date,
        shiftId: r.shiftId,
        source: r.source || 'ai',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await db.put('scheduleRecords', record)
      results.push(record)
    }
  }

  return results
}

/**
 * 删除排班记录
 */
export async function deleteScheduleRecord(id) {
  const db = await getDB()
  await db.delete('scheduleRecords', id)
}

/**
 * 获取某个月的所有排班（用于月视图）
 */
export async function getMonthSchedules(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const db = await getDB()
  const index = db.transaction('scheduleRecords').store.index('date')
  const range = IDBKeyRange.bound(startDate, endDate)
  return index.getAll(range)
}

/**
 * 清除某人的所有排班
 */
export async function clearPersonSchedules(personId) {
  const db = await getDB()
  const records = await getPersonSchedules(personId)
  const tx = db.transaction('scheduleRecords', 'readwrite')
  for (const record of records) {
    await tx.store.delete(record.id)
  }
  await tx.done
}
