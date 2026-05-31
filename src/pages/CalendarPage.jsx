import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersons } from '../hooks/usePersons'
import { useCalendar } from '../hooks/useCalendar'
import PersonSelector from '../components/PersonSelector'
import CalendarGrid from '../components/CalendarGrid'
import ShiftPicker from '../components/ShiftPicker'
import { getPersonSchedulesInRange, addScheduleRecord, deleteScheduleRecord, getColleaguesByDateAndShift } from '../db/scheduleStore'
import { getPerson } from '../db/personStore'
import { getShift, getAllShifts } from '../db/shiftStore'
import { getMemosInRange } from '../db/memoStore'
import { today as getToday, getDaysInMonth } from '../utils/date'
import { getCyclePattern, getShiftIdFromCycle, excludeDateFromCycle } from '../db/cycleStore'
import { showToast } from '../components/Toast'

export default function CalendarPage() {
  const navigate = useNavigate()
  const { activePersons } = usePersons()
  const calendar = useCalendar()
  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const [schedulesMap, setSchedulesMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [allShifts, setAllShifts] = useState([])
  const [pickerDate, setPickerDate] = useState(null)
  const [pickerColleagues, setPickerColleagues] = useState([])

  useEffect(() => {
    getAllShifts().then(setAllShifts)
  }, [])

  useEffect(() => {
    if (activePersons.length > 0 && !selectedPersonId) {
      setSelectedPersonId(activePersons[0].id)
    }
  }, [activePersons, selectedPersonId])

  const loadSchedules = useCallback(async () => {
    if (!selectedPersonId) return

    setLoading(true)
    const startDate = `${calendar.year}-${String(calendar.month).padStart(2, '0')}-01`
    const lastDay = new Date(calendar.year, calendar.month, 0).getDate()
    const endDate = `${calendar.year}-${String(calendar.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const records = await getPersonSchedulesInRange(
      selectedPersonId,
      startDate,
      endDate
    )

    const map = {}
    for (const record of records) {
      const shift = await getShift(record.shiftId)
      map[record.date] = { record, shift, hasMemo: false }
    }

    // 加载周期模式并填充未排班日期
    const cyclePattern = await getCyclePattern(selectedPersonId)
    if (cyclePattern) {
      const daysInMonth = getDaysInMonth(calendar.year, calendar.month)
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${calendar.year}-${String(calendar.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        if (!map[dateStr] || !map[dateStr].shift) {
          const shiftId = getShiftIdFromCycle(cyclePattern, dateStr)
          if (shiftId) {
            const shift = await getShift(shiftId)
            map[dateStr] = { shift, hasMemo: map[dateStr]?.hasMemo || false, isCycle: true }
          }
        }
      }
    }

    // 加载整月备注标记
    const memos = await getMemosInRange(startDate, endDate)
    const memoDateSet = new Set(memos.map((m) => m.date))
    for (const date of memoDateSet) {
      if (!map[date]) {
        map[date] = { shift: null, hasMemo: true }
      } else {
        map[date].hasMemo = true
      }
    }

    setSchedulesMap(map)
    setLoading(false)
  }, [selectedPersonId, calendar.year, calendar.month])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  const handleDateClick = async (date) => {
    if (selectedPersonId) {
      // 加载当天同班同事
      const entry = schedulesMap[date]
      const shiftId = entry?.shift?.id
      if (shiftId) {
        const colleagueRecords = await getColleaguesByDateAndShift(date, shiftId)
        const colleaguePersons = (
          await Promise.all(
            colleagueRecords
              .filter((c) => c.personId !== selectedPersonId)
              .map((c) => getPerson(c.personId))
          )
        ).filter(Boolean)
        setPickerColleagues(colleaguePersons)
      } else {
        setPickerColleagues([])
      }
      setPickerDate(date)
    } else {
      navigate(`/day/${date}`)
    }
  }

  const handleShiftSelect = async (shiftId) => {
    if (!selectedPersonId || !pickerDate) return
    try {
      await addScheduleRecord(selectedPersonId, pickerDate, shiftId, 'manual')
      showToast('排班已保存')
      setPickerDate(null)
      loadSchedules()
    } catch (err) {
      showToast(`保存失败: ${err.message}`, 'error')
    }
  }

  const handleShiftRemove = async () => {
    if (!selectedPersonId || !pickerDate) return
    try {
      const entry = schedulesMap[pickerDate]
      if (entry?.record?.id) {
        await deleteScheduleRecord(entry.record.id)
        showToast('排班已移除')
      }
      setPickerDate(null)
      loadSchedules()
    } catch (err) {
      showToast(`移除失败: ${err.message}`, 'error')
    }
  }

  const getCurrentShiftForPicker = () => {
    if (!pickerDate) return null
    const entry = schedulesMap[pickerDate]
    return entry?.shift?.id || null
  }

  const isCurrentPickerCycle = () => {
    if (!pickerDate) return false
    const entry = schedulesMap[pickerDate]
    return !!(entry?.isCycle && entry?.shift && !entry?.record)
  }

  const handleRemoveCycleShift = async () => {
    if (!selectedPersonId || !pickerDate) return
    try {
      await excludeDateFromCycle(selectedPersonId, pickerDate)
      showToast('已从此天移除周期排班')
      setPickerDate(null)
      loadSchedules()
    } catch (err) {
      showToast(`移除失败: ${err.message}`, 'error')
    }
  }

  const selectedPerson = activePersons.find(p => p.id === selectedPersonId)
  const today = getToday()

  return (
    <div>
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={calendar.goToPrevMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all text-lg"
        >
          ‹
        </button>
        <h2 className="text-lg font-bold text-slate-700">{calendar.title}</h2>
        <button
          onClick={calendar.goToNextMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all text-lg"
        >
          ›
        </button>
      </div>

      {/* 人员选择 */}
      <PersonSelector
        persons={activePersons}
        selectedId={selectedPersonId}
        onSelect={setSelectedPersonId}
      />

      {/* 日历 */}
      <div className="card mt-3">
        <p className="text-xs text-slate-400 mb-2">
          {selectedPersonId ? '点击日期可为此人员安排班次' : '选择人员后点击日期可排班'}
        </p>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
          </div>
        ) : (
          <CalendarGrid
            grid={calendar.grid}
            schedulesMap={schedulesMap}
            selectedDate={today}
            onDateClick={handleDateClick}
          />
        )}
      </div>

      {/* 班次选择器 */}
      {pickerDate && selectedPerson && (
        <ShiftPicker
          shifts={allShifts}
          currentShiftId={getCurrentShiftForPicker()}
          date={pickerDate}
          personName={selectedPerson.name}
          colleagues={pickerColleagues}
          isCycleShift={isCurrentPickerCycle()}
          onSelect={handleShiftSelect}
          onRemoveCycleShift={handleRemoveCycleShift}
          onRemove={handleShiftRemove}
          onClose={() => setPickerDate(null)}
        />
      )}
    </div>
  )
}
