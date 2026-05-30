import { getDB } from './index'
import { getPersonColor } from '../utils/color'

/**
 * 人员数据操作
 */

/**
 * 生成唯一 ID
 */
function generateId() {
  return `person_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 获取所有人员，按 order 排序
 */
export async function getAllPersons() {
  const db = await getDB()
  const all = await db.getAll('persons')
  return all.sort((a, b) => a.order - b.order)
}

/**
 * 获取活跃人员列表
 */
export async function getActivePersons() {
  const db = await getDB()
  const all = await db.getAll('persons')
  // IndexedDB 不支持 boolean 作为索引键值，所以用 getAll + JS 过滤
  return all.filter((p) => p.isActive).sort((a, b) => a.order - b.order)
}

/**
 * 根据 ID 获取人员
 */
export async function getPerson(id) {
  const db = await getDB()
  return db.get('persons', id)
}

/**
 * 添加人员
 */
export async function addPerson(name, options = {}) {
  const db = await getDB()
  const all = await getAllPersons()
  const maxOrder = all.reduce((max, p) => Math.max(max, p.order || 0), 0)

  const person = {
    id: generateId(),
    name,
    color: getPersonColor(name),
    avatar: name.charAt(0),
    isActive: options.isActive ?? true,
    order: options.order ?? maxOrder + 1,
    createdAt: Date.now(),
  }

  await db.put('persons', person)
  return person
}

/**
 * 批量添加人员
 */
export async function addPersons(names) {
  const results = []
  for (const name of names) {
    const person = await addPerson(name)
    results.push(person)
  }
  return results
}

/**
 * 更新人员
 */
export async function updatePerson(id, updates) {
  const db = await getDB()
  const person = await db.get('persons', id)
  if (!person) throw new Error(`Person not found: ${id}`)

  const updated = { ...person, ...updates }
  await db.put('persons', updated)
  return updated
}

/**
 * 删除人员（同时删除其排班记录）
 */
export async function deletePerson(id) {
  const db = await getDB()
  await db.delete('persons', id)

  // 同时删除该人员的排班记录
  const index = db.transaction('scheduleRecords').store.index('personId')
  const records = await index.getAll(id)
  const tx = db.transaction('scheduleRecords', 'readwrite')
  for (const record of records) {
    await tx.store.delete(record.id)
  }
  await tx.done
}

/**
 * 搜索人员（按名称模糊匹配）
 */
export async function searchPersons(keyword) {
  const all = await getAllPersons()
  return all.filter((p) => p.name.includes(keyword))
}

/**
 * 切换人员活跃状态
 */
export async function togglePersonActive(id) {
  const db = await getDB()
  const person = await db.get('persons', id)
  if (!person) throw new Error(`Person not found: ${id}`)

  person.isActive = !person.isActive
  await db.put('persons', person)
  return person
}
