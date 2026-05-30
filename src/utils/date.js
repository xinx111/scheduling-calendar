/**
 * 日期工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 从 YYYY-MM-DD 字符串解析为 Date 对象（本地时间）
 */
export function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * 获取当前日期的 YYYY-MM-DD
 */
export function today() {
  return formatDate(new Date())
}

/**
 * 获取某个月的天数
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

/**
 * 获取某个月的第一天是星期几（0=周日, 1=周一...）
 */
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay()
}

/**
 * 获取某个月的所有日期（补齐前后空白）
 * 返回格式：{ date: string, day: number, isCurrentMonth: boolean, isToday: boolean }[]
 */
export function getMonthCalendarGrid(year, month) {
  const firstDay = getFirstDayOfMonth(year, month)
  const daysInMonth = getDaysInMonth(year, month)
  const todayStr = today()

  // 上月补齐
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

  const grid = []

  // 上月末尾
  const prefixDays = firstDay === 0 ? 6 : firstDay - 1 // 以周一为一周开始
  for (let i = 0; i < prefixDays; i++) {
    const day = daysInPrevMonth - prefixDays + i + 1
    const date = formatDate(new Date(prevYear, prevMonth - 1, day))
    grid.push({ date, day, isCurrentMonth: false, isToday: date === todayStr })
  }

  // 当月
  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDate(new Date(year, month - 1, day))
    grid.push({ date, day, isCurrentMonth: true, isToday: date === todayStr })
  }

  // 下月补齐
  const totalCells = Math.ceil(grid.length / 7) * 7
  const suffixDays = totalCells - grid.length
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  for (let day = 1; day <= suffixDays; day++) {
    const date = formatDate(new Date(nextYear, nextMonth - 1, day))
    grid.push({ date, day, isCurrentMonth: false, isToday: date === todayStr })
  }

  return grid
}

/**
 * 获取某周的周一和周日日期
 * @param {Date} date - 周内的任意一天
 * @returns {{ weekStart: string, weekEnd: string }}
 */
export function getWeekRange(date) {
  const d = date instanceof Date ? date : new Date(date)
  const day = d.getDay() // 0=周日
  const diff = day === 0 ? -6 : 1 - day // 周一偏移
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    weekStart: formatDate(monday),
    weekEnd: formatDate(sunday),
  }
}

/**
 * 获取本周的周一日期
 */
export function getCurrentWeekStart() {
  return getWeekRange(new Date()).weekStart
}

/**
 * 格式化显示：2026年5月
 */
export function formatYearMonth(year, month) {
  return `${year}年${month}月`
}

/**
 * 日期比较
 */
export function isSameDate(a, b) {
  return formatDate(a) === formatDate(b)
}

/**
 * 获取某个日期是星期几（中文）
 */
export function getWeekdayName(dateStr) {
  const d = parseDate(dateStr)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return weekdays[d.getDay()]
}

/**
 * 获取月份偏移后的年月
 */
export function getOffsetMonth(year, month, offset) {
  const totalMonths = (year - 1) * 12 + (month - 1) + offset
  const newYear = Math.floor(totalMonths / 12) + 1
  const newMonth = (totalMonths % 12) + 1
  return { year: newYear, month: newMonth }
}
