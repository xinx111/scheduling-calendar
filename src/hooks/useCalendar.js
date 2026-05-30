import { useState, useMemo } from 'react'
import { getMonthCalendarGrid, formatYearMonth, getOffsetMonth, today } from '../utils/date'

/**
 * 日历状态 Hook
 */
export function useCalendar() {
  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1)

  const grid = useMemo(
    () => getMonthCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth]
  )

  const title = useMemo(
    () => formatYearMonth(currentYear, currentMonth),
    [currentYear, currentMonth]
  )

  const goToPrevMonth = () => {
    const { year, month } = getOffsetMonth(currentYear, currentMonth, -1)
    setCurrentYear(year)
    setCurrentMonth(month)
  }

  const goToNextMonth = () => {
    const { year, month } = getOffsetMonth(currentYear, currentMonth, 1)
    setCurrentYear(year)
    setCurrentMonth(month)
  }

  const goToToday = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth() + 1)
  }

  const goToDate = (dateStr) => {
    const [year, month] = dateStr.split('-').map(Number)
    setCurrentYear(year)
    setCurrentMonth(month)
  }

  return {
    year: currentYear,
    month: currentMonth,
    title,
    grid,
    today: today(),
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    goToDate,
  }
}
