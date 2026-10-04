import { getDB } from './index'
import { parseDate, formatDate } from '../utils/date'

/**
 * 备忘录数据操作
 *
 * repeatRule 结构：
 *   null              — 不重复
 *   { type: 'daily' } — 每天重复
 *   { type: 'weekly', weekdays: [1,2,3,4,5] } — 每周特定几天（0=周日）
 *   { type: 'shift', shiftId: 'shift-morning' } — 当天排班为该班次时
 */

function generateId() {
  return `memo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 获取某天的所有备忘录
 */
export async function getMemosByDate(date) {
  const db = await getDB()
  const index = db.transaction('memos').store.index('date')
  return index.getAll(date).then((memos) =>
    memos.sort((a, b) => b.createdAt - a.createdAt)
  )
}

/**
 * 获取所有未完成的提醒
 */
export async function getPendingReminders() {
  const db = await getDB()
  const all = await db.getAll('memos')
  return all
    .filter((m) => !m.isDone && m.remindAt)
    .sort((a, b) => (a.remindAt < b.remindAt ? -1 : 1))
}

/**
 * 获取即将到来的提醒（当前时间之后的）
 */
export async function getUpcomingReminders() {
  const now = Date.now()
  const pending = await getPendingReminders()
  return pending.filter((m) => m.remindAt > now)
}

/**
 * 添加备忘录
 */
export async function addMemo(data) {
  const db = await getDB()
  const memo = {
    id: generateId(),
    date: data.date,
    content: data.content,
    personId: data.personId || null,
    remindAt: data.remindAt || null,
    isAlarm: data.isAlarm || false,
    repeatRule: data.repeatRule || null,
    isDone: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  await db.put('memos', memo)
  return memo
}

/**
 * 获取某人在某个日期范围内的备忘录（含重复展开）
 * @param {function} getShiftForDateFn - (dateStr) => shiftId|null，用于计算该人某天的班次
 */
export async function getMemosInRangeByPerson(startDate, endDate, personId, getShiftForDateFn) {
  // 1. 先取日期范围内的备注
  const rangeMemos = await getMemosInRange(startDate, endDate)
  let result = rangeMemos.filter((m) => !m.personId || m.personId === personId)

  // 2. 取所有有重复规则的备注
  const db = await getDB()
  const allMemos = await db.getAll('memos')
  const repeatMemos = allMemos.filter(
    (m) => m.repeatRule && !m.isDone && (!m.personId || m.personId === personId)
  )

  if (repeatMemos.length === 0) return result

  const start = parseDate(startDate)
  const end = parseDate(endDate)
  const originalDates = new Set(result.map((m) => m.date + '_' + m.id))

  for (const memo of repeatMemos) {
    const rule = memo.repeatRule
    const current = new Date(start)

    while (current <= end) {
      const dateStr = formatDate(current)
      const key = dateStr + '_' + memo.id
      // 跳过原始备注本身的日期（已被 rangeMemos 包含）
      if (originalDates.has(key)) { current.setDate(current.getDate() + 1); continue }

      let shouldApply = false

      switch (rule.type) {
        case 'daily':
          shouldApply = true
          break
        case 'weekly':
          if (rule.weekdays && rule.weekdays.includes(current.getDay())) {
            shouldApply = true
          }
          break
        case 'shift':
          if (rule.shiftId && getShiftForDateFn) {
            const shiftId = getShiftForDateFn(dateStr)
            shouldApply = shiftId === rule.shiftId
          }
          break
      }

      if (shouldApply && (!rule.endDate || dateStr <= rule.endDate)) {
        result.push({ ...memo, id: key, date: dateStr, isRepeated: true })
      }

      current.setDate(current.getDate() + 1)
    }
  }

  return result
}

/**
 * 更新备忘录
 */
export async function updateMemo(id, updates) {
  const db = await getDB()
  const memo = await db.get('memos', id)
  if (!memo) throw new Error(`Memo not found: ${id}`)

  const updated = { ...memo, ...updates, updatedAt: Date.now() }
  await db.put('memos', updated)
  return updated
}

/**
 * 重复展开的备忘录 id 形如 "2026-06-07_memo_xxx"，
 * 完成或删除都作用于原始备忘录
 */
function resolveOriginalMemoId(id) {
  const marker = id.indexOf('memo_')
  return marker > 0 ? id.slice(marker) : id
}

/**
 * 标记提醒完成（对重复备注，标记原始备注完成，所有重复都消失）
 */
export async function markMemoDone(id) {
  return updateMemo(resolveOriginalMemoId(id), { isDone: true })
}

/**
 * 删除备忘录
 */
export async function deleteMemo(id) {
  const db = await getDB()
  await db.delete('memos', resolveOriginalMemoId(id))
}

/**
 * 获取某个日期范围内的备忘录
 */
export async function getMemosInRange(startDate, endDate) {
  const db = await getDB()
  const index = db.transaction('memos').store.index('date')
  const range = IDBKeyRange.bound(startDate, endDate)
  return index.getAll(range).then((memos) =>
    memos.sort((a, b) => (a.date < b.date ? -1 : 1))
  )
}
