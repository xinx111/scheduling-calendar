import { getDB } from './index'

/**
 * 备忘录数据操作
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
  // IndexedDB 不支持 boolean 作为索引键值，用 getAll + JS 过滤
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
    isDone: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  await db.put('memos', memo)
  return memo
}

/**
 * 获取某人在某个日期范围内的备忘录
 */
export async function getMemosInRangeByPerson(startDate, endDate, personId) {
  const all = await getMemosInRange(startDate, endDate)
  return all.filter((m) => !m.personId || m.personId === personId)
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
 * 标记提醒完成
 */
export async function markMemoDone(id) {
  return updateMemo(id, { isDone: true })
}

/**
 * 删除备忘录
 */
export async function deleteMemo(id) {
  const db = await getDB()
  await db.delete('memos', id)
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
