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
import { getCyclePattern, saveCyclePattern, deleteCyclePattern, getShiftIdFromCycle } from '../db/cycleStore'
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
  const [currentCycle, setCurrentCycle] = useState(null)

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

    // 加载周期模式并填充未排班日期
    const cyclePattern = await getCyclePattern(selectedPersonId)
    setCurrentCycle(cyclePattern)

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
    setDataLoading(false)
  }, [selectedPersonId, calendar.year, calendar.month])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  // 点击日期
  const handleDateClick = (date) => {
    if (!selectedPersonId) {
      // 没选人员 → 跳到详情页看全员排班
      navigate(`/day/${date}`)
      return
    }
    // 选了人员 → 弹出班次选择器
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
      // 查找当前排班记录 ID
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

  // 保存周期
  const handleCycleSave = async (patternData) => {
    try {
      await saveCyclePattern(patternData)
      showToast('周期已保存，将自动填充排班')
      setCycleDialogOpen(false)
      loadSchedules()
    } catch (err) {
      showToast(`保存周期失败: ${err.message}`, 'error')
    }
  }

  // 删除周期
  const handleCycleDelete = async (personId) => {
    try {
      await deleteCyclePattern(personId)
      showToast('周期已删除')
      loadSchedules()
    } catch (err) {
      showToast(`删除周期失败: ${err.message}`, 'error')
    }
  }

  const weekRange = getWeekRange(new Date())

  if (personsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 日历卡片 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={calendar.goToPrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all"
            >
              ←
            </button>
            <h2 className="text-base font-bold text-slate-700">
              {calendar.title}
            </h2>
            <button
              onClick={calendar.goToNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all"
            >
              →
            </button>
          </div>
          <button
            onClick={calendar.goToToday}
            className="text-xs text-primary-600 font-medium px-3 py-1 rounded-full bg-primary-50 active:bg-primary-100"
          >
            今天
          </button>
        </div>

        {/* 人员选择 */}
        <PersonSelector
          persons={activePersons}
          selectedId={selectedPersonId}
          onSelect={setSelectedPersonId}
        />

        {/* 周期指示条 */}
        {currentCycle && selectedPersonId && (
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-xs text-amber-600">
              🔁 已设置 {currentCycle.cycleDays} 天循环周期
            </span>
            <button
              onClick={() => setCycleDialogOpen(true)}
              className="text-xs text-primary-600 underline underline-offset-2"
            >
              编辑
            </button>
          </div>
        )}

        {/* 日历 */}
        {dataLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full" />
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
      <div className="flex flex-wrap gap-2">
        {selectedPersonId && (
          <button
            onClick={() => setCycleDialogOpen(true)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
              currentCycle
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-white text-slate-600 border border-gray-200 hover:border-primary-300'
            }`}
          >
            🔁 {currentCycle ? '编辑周期' : '设置排班周期'}
          </button>
        )}
        <button
          onClick={() => navigate('/upload')}
          className="flex-1 btn-primary text-center"
        >
          📷 拍照识别
        </button>
      </div>

      {/* 操作提示 */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-600 mb-2">
          📋 当前周 ({weekRange.weekStart} ~ {weekRange.weekEnd})
        </h3>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• 选中人员后点击日期即可手动排班</li>
          <li>• 底部可设置排班周期，自动填充未来日期</li>
          <li>• 点击「拍照识别」通过 AI 导入排班表</li>
          <li>• 点击日期可查看该日全员排班详情</li>
        </ul>
      </div>

      {/* 班次选择器弹出层 */}
      {pickerDate && selectedPerson && (
        <ShiftPicker
          shifts={allShifts}
          currentShiftId={getCurrentShiftForPicker()}
          date={pickerDate}
          personName={selectedPerson.name}
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
          existingPattern={currentCycle}
          onSave={handleCycleSave}
          onDelete={handleCycleDelete}
          onClose={() => setCycleDialogOpen(false)}
        />
      )}
    </div>
  )
}
