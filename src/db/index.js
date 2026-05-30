import { openDB } from 'idb'
import { DEFAULT_SHIFTS } from '../constants'

const DB_NAME = 'scheduling-calendar'
const DB_VERSION = 3

/**
 * 初始化 IndexedDB 数据库
 *
 * v2 → v3 (2026-05-30): 修复部分用户数据库为空壳（版本2但无表）的问题。
 *   升级时 `if (!contains(...))` 确保：
 *   - 正常用户：表已存在 → 跳过创建 → 数据无损
 *   - 空壳用户：表不存在 → 创建所有表
 */
export async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // ----- persons 表 -----
      if (!db.objectStoreNames.contains('persons')) {
        const personStore = db.createObjectStore('persons', {
          keyPath: 'id',
        })
        personStore.createIndex('name', 'name', { unique: false })
        personStore.createIndex('isActive', 'isActive', { unique: false })
        personStore.createIndex('order', 'order', { unique: false })
      }

      // ----- shiftTemplates 表 -----
      if (!db.objectStoreNames.contains('shiftTemplates')) {
        const shiftStore = db.createObjectStore('shiftTemplates', {
          keyPath: 'id',
        })
        shiftStore.createIndex('name', 'name', { unique: false })
        shiftStore.createIndex('isDefault', 'isDefault', { unique: false })
      }

      // ----- scheduleRecords 表（核心排班数据）-----
      if (!db.objectStoreNames.contains('scheduleRecords')) {
        const recordStore = db.createObjectStore('scheduleRecords', {
          keyPath: 'id',
        })
        recordStore.createIndex('personId', 'personId', { unique: false })
        recordStore.createIndex('date', 'date', { unique: false })
        recordStore.createIndex('shiftId', 'shiftId', { unique: false })
        recordStore.createIndex('personId+date', ['personId', 'date'], {
          unique: true,
        })
        recordStore.createIndex('date+shiftId', ['date', 'shiftId'], {
          unique: false,
        })
      }

      // ----- schedules 表（排班表批次）-----
      if (!db.objectStoreNames.contains('schedules')) {
        db.createObjectStore('schedules', {
          keyPath: 'id',
        }).createIndex('weekStart', 'weekStart', { unique: false })
      }

      // ----- memos 表（备忘录）-----
      if (!db.objectStoreNames.contains('memos')) {
        const memoStore = db.createObjectStore('memos', {
          keyPath: 'id',
        })
        memoStore.createIndex('date', 'date', { unique: false })
        memoStore.createIndex('remindAt', 'remindAt', { unique: false })
        memoStore.createIndex('isDone', 'isDone', { unique: false })
      }

      // ----- cyclePatterns 表（排班周期模式）-----
      if (!db.objectStoreNames.contains('cyclePatterns')) {
        db.createObjectStore('cyclePatterns', {
          keyPath: 'personId',
        })
      }
    },
  })

  // 首次启动：初始化默认班次
  const shiftCount = await db.count('shiftTemplates')
  if (shiftCount === 0) {
    const tx = db.transaction('shiftTemplates', 'readwrite')
    for (const shift of DEFAULT_SHIFTS) {
      await tx.store.put(shift)
    }
    await tx.done
  }

  return db
}

/**
 * 获取数据库实例（懒加载）
 */
let _db = null

export async function getDB() {
  if (!_db) {
    _db = await initDB()
  }
  return _db
}

/**
 * 重置数据库
 * 清空所有表的数据
 */
export async function resetDB() {
  const db = await getDB()

  const storeNames = Array.from(db.objectStoreNames)
  for (const name of storeNames) {
    // 跳过 shiftTemplates，后面单独重置
    if (name === 'shiftTemplates') continue
    const tx = db.transaction(name, 'readwrite')
    await tx.store.clear()
    await tx.done
  }

  // 重置班次（清空后插入默认）
  const shiftTx = db.transaction('shiftTemplates', 'readwrite')
  await shiftTx.store.clear()
  await shiftTx.done

  const insertTx = db.transaction('shiftTemplates', 'readwrite')
  for (const shift of DEFAULT_SHIFTS) {
    await insertTx.store.put(shift)
  }
  await insertTx.done

  return db
}
