import { openDB } from 'idb'
import { DEFAULT_SHIFTS } from '../constants'

const DB_NAME = 'scheduling-calendar'
const DB_VERSION = 2

/**
 * 获取当前数据库版本号（检测已有数据库的版本）
 */
async function getCurrentDBVersion() {
  try {
    const db = await openDB(DB_NAME, undefined, { upgrade() {} })
    const version = db.version
    db.close()
    return version
  } catch {
    return 0 // 数据库不存在
  }
}

/**
 * 初始化 IndexedDB 数据库
 * 创建所有数据表和索引
 */
export async function initDB() {
  // 检测已有版本，避免用低版本打开高版本数据库导致崩溃
  const currentVersion = await getCurrentDBVersion()
  const targetVersion = Math.max(DB_VERSION, currentVersion)

  const db = await openDB(DB_NAME, targetVersion, {
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
        // 复合索引：按人和日期查询
        recordStore.createIndex('personId+date', ['personId', 'date'], {
          unique: true,
        })
        // 复合索引：按日期和班次（找同班同事）
        recordStore.createIndex('date+shiftId', ['date', 'shiftId'], {
          unique: false,
        })
      }

      // ----- schedules 表（排班表批次）-----
      if (!db.objectStoreNames.contains('schedules')) {
        const scheduleStore = db.createObjectStore('schedules', {
          keyPath: 'id',
        })
        scheduleStore.createIndex('weekStart', 'weekStart', { unique: false })
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
        const cycleStore = db.createObjectStore('cyclePatterns', {
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
 * 重置数据库（调试用）
 * 删除整个数据库后重新初始化（避免版本号冲突）
 */
export async function resetDB() {
  _db = null

  // 先关闭旧连接
  await openDB(DB_NAME, DB_VERSION, { upgrade() {} }).then((db) => db.close())

  // 删除整个数据库
  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = resolve
    req.onerror = () => reject(new Error('删除数据库失败'))
    req.onblocked = () => reject(new Error('数据库被占用，请关闭其他标签页后重试'))
  })

  // 重新初始化（此时 DB_VERSION=1 是最新的版本号）
  return initDB()
}
