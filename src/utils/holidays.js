import { HOLIDAY_DATA } from '../data/holidays.js'
import { parseDate, formatDate } from './date.js'

/**
 * 节假日查询（模块加载时把区间展开成 date -> info 的映射）
 */

const holidayMap = new Map()

function registerOffRange(startStr, endStr, name) {
  const cursor = parseDate(startStr)
  const end = parseDate(endStr)
  while (cursor <= end) {
    holidayMap.set(formatDate(cursor), { name, isWorkday: false })
    cursor.setDate(cursor.getDate() + 1)
  }
}

for (const data of Object.values(HOLIDAY_DATA)) {
  for (const [start, end, name] of data.offDays) {
    registerOffRange(start, end, name)
  }
  for (const [date, name] of data.workDays) {
    holidayMap.set(date, { name, isWorkday: true })
  }
}

/**
 * 查询某天的节假日信息
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {{ name: string, isWorkday: boolean } | null}
 *   法定放假日返回 { name, isWorkday: false }
 *   调休补班日返回 { name, isWorkday: true }
 *   普通日期返回 null
 */
export function getHolidayInfo(dateStr) {
  return holidayMap.get(dateStr) || null
}

/**
 * 是否法定放假日
 */
export function isStatutoryHoliday(dateStr) {
  const info = getHolidayInfo(dateStr)
  return !!info && !info.isWorkday
}

/**
 * 是否调休补班日（周末但需上班）
 */
export function isMakeupWorkday(dateStr) {
  const info = getHolidayInfo(dateStr)
  return !!info && info.isWorkday
}
