import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersons } from '../hooks/usePersons'
import { useCalendar } from '../hooks/useCalendar'
import PersonSelector from '../components/PersonSelector'
import CalendarGrid from '../components/CalendarGrid'
import ShiftPicker from '../components/ShiftPicker'
import CycleDialog from '../components/CycleDialog'
import { getWeekRange, today as getToday, getDaysInMonth } from '../utils/date'
import { getPersonSchedulesInRange, addScheduleRecord, deleteScheduleRecord } from '../db/scheduleStore'
import { getShift, getAllShifts } from '../db/shiftStore'
import { getMemosInRange } from '../db/memoStore'
import { getPersonCycles, saveCyclePattern, getShiftIdFromCycle } from '../db/cycleStore'
import { showToast } from '../components/Toast'

export default function HomePage() {
  const navigate = useNavigate()
  const { activePersons, persons, loading: personsLoading } = usePersons()
  const calendar = useCalendar()
  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const [schedulesMap, setSchedulesMap] = useState({})
  const [dataLoading, setDataLoading] = useState(false)

  // 手动排班状态
  const [pickerDate, setPickerDate] = useState(null)
  const [allShifts, setAllShifts] = useState([])
  const [cycleDialogOpen, setCycleDialogOpen] = useState(false)
  const [currentCycles, setCurrentCycles] = useState([])

  // 获取当前选中人员
  const selectedPerson = persons.find((p) => p.id === selectedPersonId)

  // 加载班次模板
  useEffect(() => {
    getAllShifts().then(setAllShifts)
  }, [])

  // 默认选中第一个活跃人员
  useEffect(() => {
    if (activePersons.length > 0 && !selectedPersonId) {
      setSelectedPersonId(activePersons[0].id)
    }
  }, [activePersons, selectedPersonId])

  // 加载排班 + 周期模式 + 同事数据
  const loadSchedules = useCallback(async () => {
    if (!selectedPersonId) return

    setDataLoading(true)
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

    // 加载周期模式并填充未排班日期（支持多周期）
    const cycles = await getPersonCycles(selectedPersonId)
    setCurrentCycles(cycles)

    if (cycles.length > 0) {
      const daysInMonth = getDaysInMonth(calendar.year, calendar.month)
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${calendar.year}-${String(calendar.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        if (!map[dateStr] || !map[dateStr].shift) {
          const shiftId = getShiftIdFromCycle(cycles, dateStr)
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
    setDataLoading(false)
  }, [selectedPersonId, calendar.year, calendar.month])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  // 点击日期
  const handleDateClick = async (date) => {
    if (!selectedPersonId) {
      navigate(`/day/${date}`)
      return
    }
    setPickerDate(date)
  }

  // 选择班次
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

  // 移除排班
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

  // 获取当前选中日期的班次
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

  // 保存周期
  const handleCycleSave = async (patternData) => {
    try {
      await saveCyclePattern(patternData)
      showToast('周期已保存')
      loadSchedules()
    } catch (err) {
      showToast(`保存失败: ${err.message}`, 'error')
    }
  }

  const weekRange = getWeekRange(new Date())

  if (personsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-3.5 animate-fade-in">
      {/* 日历卡片 */}
      <div className="card overflow-hidden">
        {/* 人员选择 */}
        <PersonSelector
          persons={activePersons}
          selectedId={selectedPersonId}
          onSelect={setSelectedPersonId}
        />

        {/* 月份导航 */}
        <div className="flex items-center justify-between mt-2 mb-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={calendar.goToPrevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-90 transition-all text-slate-500 font-medium"
            >
              ‹
            </button>
            <h2 className="text-base font-bold text-slate-700 min-w-[100px] text-center">
              {calendar.title}
            </h2>
            <button
              onClick={calendar.goToNextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-90 transition-all text-slate-500 font-medium"
            >
              ›
            </button>
          </div>
          <button
            onClick={calendar.goToToday}
            className="text-xs font-semibold text-white px-3.5 py-1.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 shadow-sm shadow-primary-200/40 active:scale-95 transition-all"
          >
            今天
          </button>
        </div>

        {/* 周期指示条 */}
        {currentCycles.length > 0 && selectedPersonId && (
          <div className="flex items-center justify-between mt-2.5 px-1 py-1.5 bg-amber-50/60 rounded-xl border border-amber-200/40">
            <span className="text-xs text-amber-700 font-medium">🔁 已设置 {currentCycles.length} 个排班周期</span>
            <button onClick={() => setCycleDialogOpen(true)} className="text-xs font-medium text-primary-600 underline underline-offset-2">编辑</button>
          </div>
        )}

        {/* 日历 */}
        {dataLoading ? (
          <div className="flex justify-center py-10">
            <div className="spinner" />
          </div>
        ) : (
          <CalendarGrid
            grid={calendar.grid}
            schedulesMap={schedulesMap}
            selectedDate={getToday()}
            onDateClick={handleDateClick}
          />
        )}
      </div>

      {/* 快捷操作 */}
      <div className="flex gap-2.5">
        {selectedPersonId && (
          <button
            onClick={() => setCycleDialogOpen(true)}
            className="px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 flex-shrink-0 bg-amber-50 text-amber-700 border border-amber-200 shadow-sm"
          >
            🔁 设置周期
          </button>
        )}
        <button
          onClick={() => navigate('/upload')}
          className="flex-1 btn-primary text-center flex items-center justify-center gap-1.5 shadow-lg shadow-primary-200/30"
        >
          <span>📷</span>
          <span>拍照识别</span>
        </button>
      </div>

      {/* 本周概览 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">📋</span>
          <h3 className="text-sm font-bold text-slate-600">本周 ({weekRange.weekStart} ~ {weekRange.weekEnd})</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-3 rounded-xl bg-primary-50/60">
            <p className="text-lg font-bold text-primary-600">{activePersons.length}</p>
            <p className="text-xs text-slate-400">排班人数</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-emerald-50/60">
            <p className="text-lg font-bold text-emerald-600">{currentCycles.length}</p>
            <p className="text-xs text-slate-400">周期数</p>
          </div>
        </div>
      </div>

      {/* 班次选择器弹出层 */}
      {pickerDate && selectedPerson && (
        <ShiftPicker
          shifts={allShifts}
          currentShiftId={getCurrentShiftForPicker()}
          date={pickerDate}
          personName={selectedPerson.name}
          personId={selectedPerson.id}
          isCycleShift={isCurrentPickerCycle()}
          onSelect={handleShiftSelect}
          onRemove={handleShiftRemove}
          onClose={() => setPickerDate(null)}
        />
      )}

      {/* 周期设置对话框 */}
      {cycleDialogOpen && selectedPerson && (
        <CycleDialog
          personId={selectedPerson.id}
          personName={selectedPerson.name}
          onSave={handleCycleSave}
          onClose={() => { setCycleDialogOpen(false); loadSchedules() }}
        />
      )}
    </div>
  )
}
