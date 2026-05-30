import { useState, useEffect, useCallback } from 'react'
import * as scheduleStore from '../db/scheduleStore'
import * as shiftStore from '../db/shiftStore'
import * as personStore from '../db/personStore'

/**
 * 排班数据 Hook
 */
export function useSchedules() {
  const [loading, setLoading] = useState(false)

  /**
   * 获取某人在某月的排班
   */
  const getPersonMonthSchedules = useCallback(async (personId, year, month) => {
    setLoading(true)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const records = await scheduleStore.getPersonSchedulesInRange(
      personId,
      startDate,
      endDate
    )

    // 转换为 map: { "2026-05-25": { shift, colleagues } }
    const result = {}
    for (const record of records) {
      const shift = await shiftStore.getShift(record.shiftId)
      // 获取同班同事
      const colleagues = await scheduleStore.getColleaguesByDateAndShift(
        record.date,
        record.shiftId
      )
      const colleaguePersons = await Promise.all(
        colleagues
          .filter((c) => c.personId !== personId)
          .map((c) => personStore.getPerson(c.personId))
      )

      result[record.date] = {
        record,
        shift,
        colleagues: colleaguePersons.filter(Boolean),
      }
    }

    setLoading(false)
    return result
  }, [])

  /**
   * 获取某天的所有排班信息
   */
  const getDayInfo = useCallback(async (date) => {
    const records = await scheduleStore.getSchedulesByDate(date)

    const dayInfo = await Promise.all(
      records.map(async (record) => {
        const [person, shift, colleagues] = await Promise.all([
          personStore.getPerson(record.personId),
          shiftStore.getShift(record.shiftId),
          scheduleStore.getColleaguesByDateAndShift(date, record.shiftId),
        ])

        const colleaguePersons = await Promise.all(
          colleagues
            .filter((c) => c.personId !== record.personId)
            .map((c) => personStore.getPerson(c.personId))
        )

        return {
          record,
          person,
          shift,
          colleagues: colleaguePersons.filter(Boolean),
        }
      })
    )

    // 按班次分组
    const grouped = {}
    for (const info of dayInfo) {
      if (!info.shift) continue
      const shiftId = info.shift.id
      if (!grouped[shiftId]) {
        grouped[shiftId] = { shift: info.shift, persons: [] }
      }
      grouped[shiftId].persons.push(info.person)
    }

    return { dayInfo, grouped: Object.values(grouped) }
  }, [])

  const addRecord = useCallback(async (personId, date, shiftId, source) => {
    return scheduleStore.addScheduleRecord(personId, date, shiftId, source)
  }, [])

  const deleteRecord = useCallback(async (id) => {
    return scheduleStore.deleteScheduleRecord(id)
  }, [])

  return {
    loading,
    getPersonMonthSchedules,
    getDayInfo,
    addRecord,
    deleteRecord,
  }
}
